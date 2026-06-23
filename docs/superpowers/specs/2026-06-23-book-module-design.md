# Book Module Design Spec

**Date**: 2026-06-23  
**Status**: Approved  
**Scope**: 实现二手书交易模块（列表、详情、发布/编辑）

---

## 1. Overview

将现有静态 `book/index.jsx`（使用 `StaticListPage` 组件渲染 `bookGroups` 静态数据）替换为完整的动态二手书模块，包含三个页面：列表页（搜索 + 分类筛选 + 分页）、详情页（轮播图 + 信息 + 想要按钮）、编辑页（新增/编辑表单 + 图片上传）。

所有 API 请求遵循现有 `service/hbut/` 模式封装，列表数据带 5 分钟缓存。

---

## 2. Routing

沿用 club 模块的嵌套子目录结构，在 `app.config.js` 的 `subPackages` 中注册：

```js
// app.config.js subPackages 中新增（在现有 "pages/book/index" 之后）
"pages/book/detail/index",
"pages/book/edit/index",
```

导航路径：
- 列表页：`/modules/pages/book/index`
- 详情页：`/modules/pages/book/detail/index?id={bookId}`
- 编辑页：`/modules/pages/book/edit/index`（新增，无 id）
- 编辑页：`/modules/pages/book/edit/index?id={bookId}`（编辑，有 id）

---

## 3. Service Layer

### 3.1 文件

- **新增** `src/service/hbut/book.js` — 全部 API 封装
- **修改** `src/service/hbut/index.js` — 重新导出 book 函数
- **修改** `src/service/index.js` — 添加统一导出（api 包装）
- **修改** `src/utils/serverRequest.h5.js` — 新增 `serverUpload`
- **修改** `src/utils/serverRequest.weapp.js` — 新增 `serverUpload`

### 3.2 API Endpoints

| Function | Method | Endpoint | Cache |
|---|---|---|---|
| `getBookList` | GET | `/api/v1/books?page=&pageSize=&keyword=&category=` | 5 min |
| `getBookCategories` | GET | `/api/v1/books/categories` | 5 min |
| `getBookDetail` | GET | `/api/v1/books/:id` | none |
| `createBook` | POST | `/api/v1/books` | clears list cache |
| `updateBook` | PUT | `/api/v1/books/:id` | clears list cache |
| `toggleWantBook` | POST | `/api/v1/books/:id/want` | none |
| `uploadBookImage` | POST | `/api/v1/books/upload` | none |
| `deleteBookImage` | DELETE | `/api/v1/books/images/:imageId`（无 bookId 时）<br>`/api/v1/books/:id/images/:imageId`（有 bookId 时） | none |

### 3.3 Function Signatures

```js
// 列表（分页 + 搜索 + 筛选），缓存 key: "v1_books"
getBookList({ page=1, pageSize=20, keyword='', category='' }, forceRefresh=false)
  → { books: Array, total: number }

// 分类列表，缓存 key: "v1_book_categories"
getBookCategories(forceRefresh=false)
  → string[]  // ["全部", "教材", "小说", ...]

// 详情
getBookDetail(id)
  → { id, name, isbn, category, price, condition, description,
      images: [{ url, imageId }], publisherName, publishTime,
      isWanted: boolean, isPublisher: boolean }

// 新增
createBook({ name, isbn, category, price, condition, description, images })
  → { success: true, id: string }

// 更新
updateBook(id, { name, isbn, category, price, condition, description, images })
  → { success: true }

// 想要/取消想要
toggleWantBook(id)
  → { success: true, isWanted: boolean }

// 上传图片（Header: Authorization: Bearer <token>）
uploadBookImage(filePath)
  → { url: string, imageId: string }

// 删除图片（bookId 可选，新增模式下为 null）
deleteBookImage(bookId, imageId)
  → { success: true }
```

### 3.4 Cache Strategy

- 列表数据缓存 key `"v1_books"`，TTL 5 分钟
- 分类数据缓存 key `"v1_book_categories"`，TTL 5 分钟
- `createBook` / `updateBook` 成功后清除 `"v1_books"` 缓存
- 列表页进入：先读缓存渲染 → 静默请求 API → 更新缓存和 UI

### 3.5 serverUpload Implementation

在 `serverRequest.h5.js` 和 `serverRequest.weapp.js` 中新增：

```js
// H5 版本 — 使用 Taro.uploadFile
export async function serverUpload(url, filePath, params = {}) {
  const token = userManager.getServerToken();
  const res = await Taro.uploadFile({
    url: BASE_URL + url,
    filePath,
    name: 'file',
    formData: params,
    header: { Authorization: token ? `Bearer ${token}` : '' },
  });
  return JSON.parse(res.data);
}

// WeApp 版本 — 通过云函数代理或直接 uploadFile
// （逻辑同 H5 但 baseURL 和 token 处理按现有 weapp 模式）
```

### 3.6 Error Handling

- 所有 service 函数内部 try/catch，`runtimeLogger.error()` 记录上下文，然后 `throw error`
- 页面层统一 catch，`Taro.showToast({ icon: 'none' })` 提示
- 列表请求失败时不覆盖已有缓存数据
- 上传失败单独 toast，不阻塞表单其他操作

---

## 4. Page: 书籍列表 (`book/index.jsx`)

### 4.1 State

```js
const [books, setBooks] = useState([]);
const [categories, setCategories] = useState([]);
const [activeCategory, setActiveCategory] = useState('全部');
const [keyword, setKeyword] = useState('');
const [page, setPage] = useState(1);
const [total, setTotal] = useState(0);
const [loading, setLoading] = useState('cache'); // 'cache'|'loading'|'error'|'done'|'empty'
```

### 4.2 Lifecycle

```
useLoad()
  → cacheManager.get('v1_books') → 有缓存: setBooks, loading='cache'
  → getBookCategories() → setCategories
  → fetchList(page=1) → 成功: setBooks, loading='done'/'empty', cacheManager.set
                       → 失败: 有缓存保留, 无缓存 loading='error'

useDidShow()
  → fetchList(page=1)  // 从编辑/详情返回时刷新

usePullDownRefresh()
  → fetchList(page=1, forceRefresh=true) → Taro.stopPullDownRefresh()
```

### 4.3 Search

```jsx
<Input
  placeholder="搜索书名/书号"
  onInput={(e) => {
    setKeyword(e.detail.value);
    debounceRef.current && clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchList(1, e.detail.value, activeCategory);
    }, 300);
  }}
/>
```

### 4.4 Category Filter

```
横向 ScrollView，渲染 categories.map()
  默认选中"全部"
  点击标签 → setActiveCategory, page=1, fetchList
  选中标签高亮样式
```

### 4.5 Book List

```
ScrollView (scrollY, onScrollToLower 加载更多, onRefresh 下拉刷新)

每项卡片:
  ┌──────────────────────────────────┐
  │ ┌──────┐                         │
  │ │ 缩略 │ 书名 (bold)              │
  │ │ 图/  │ ¥price (red)            │
  │ │ 占位 │ publisherName · category │
  │ └──────┘                         │
  └──────────────────────────────────┘
```

- 左侧：120×120rpx 图片或占位头像。无图时书名首字 + `getColorFromName()` 背景色
- 右侧：flex:1，书名粗体、价格红色 ¥ 前缀、发布人 · 类别
- 卡片 `border-radius: 16rpx`，点击 → `navigateTo(detail?id=book.id)`
- `hasMore = books.length < total`，false 时不触发加载更多

### 4.6 Status Views

| State | Display |
|---|---|
| `loading`（无缓存） | 3 个 Skeleton 灰色闪烁占位卡片 |
| `error`（无缓存） | "加载失败，点击重试" 文字，点击触发重试 |
| `empty` | "暂无书籍" 居中文字 |
| `done` | 正常列表 |

### 4.7 FAB Button

```
position: fixed, bottom: 120rpx, right: 40rpx
width/height: 100rpx, border-radius: 50%
蓝色背景 #47a5fd, 白色 "+" 文字 48rpx
box-shadow
onClick → navigateTo(edit?id=)
```

---

## 5. Page: 书籍详情 (`book/detail/index.jsx`)

### 5.1 State

```js
const [book, setBook] = useState(null);
const [loading, setLoading] = useState(true);
const [wantLoading, setWantLoading] = useState(false);
const { id } = Taro.useRouter().params;
```

### 5.2 Lifecycle

```
useLoad()
  → if (!id) → toast "无效的书籍" → navigateBack
  → setLoading(true)
  → getBookDetail(id)
     → 成功: setBook
     → 失败/null: toast "加载失败" / "书籍不存在" → navigateBack
  → setLoading(false)
```

### 5.3 Swiper

```
images.length > 0:
  <Swiper indicatorDots>
    images.map(img => <SwiperItem><Image src={img.url} mode="aspectFill"/></SwiperItem>)
  </Swiper>

images.length === 0:
  <View> 占位文字 "暂无图片" </View>
```

### 5.4 Info Section

```
书名  36rpx bold
¥price  32rpx red

分隔线
ISBN       978-7-xxx
类别       教材
发布人     张三
发布时间    2026-06-20
新旧程度   [标签]  // 全新:绿 几乎全新:蓝 有笔记:橙 较旧:灰
分隔线

描述：
多行文本内容...
```

### 5.5 Bottom Fixed Bar

```
┌──────────────────────────────────┐
│  [想要/已想要]          [编辑]    │
└──────────────────────────────────┘

逻辑:
- isWanted === false → 空心按钮 "想要"
- isWanted === true  → 实心高亮按钮 "已想要"
- 点击 → wantLoading=true → toggleWantBook(id)
  → 成功: setBook({...book, isWanted: !book.isWanted})
  → 失败: toast
  → wantLoading=false
- wantLoading=true 时按钮禁用

- isPublisher === true → 右侧显示 "编辑" 按钮 → navigateTo(edit?id=id)
- isPublisher === false → 不显示
```

### 5.6 Loading State

进入页面时展示全屏 loading 蒙层（`AtActivityIndicator` center），数据加载完成后隐藏。

---

## 6. Page: 添加/编辑书籍 (`book/edit/index.jsx`)

### 6.1 Mode Detection

```
router.params.id
  → 有值 → 编辑模式: title="编辑书籍"
  → 无值 → 新增模式: title="发布书籍"
```

### 6.2 State

```js
const [id, setId] = useState('');
const [name, setName] = useState('');
const [isbn, setIsbn] = useState('');
const [category, setCategory] = useState('');
const [categoryOptions, setCategoryOptions] = useState([]);
const [price, setPrice] = useState('');
const [condition, setCondition] = useState('全新');
const [description, setDescription] = useState('');
const [images, setImages] = useState([]);  // [{ url, imageId }]
const [submitting, setSubmitting] = useState(false);
const [fetched, setFetched] = useState(false); // 编辑模式预填完成标记
const [uploading, setUploading] = useState(false); // 上传中
```

### 6.3 Lifecycle

```
useLoad()
  → getBookCategories() → setCategoryOptions(['全部', ...cats])
  → if (id):
      getBookDetail(id)
        → setState({ name, isbn, category, price, condition, description, images, id })
        → setFetched(true)
  → else:
      setFetched(true)
  → fetched===false: 显示 loading
```

### 6.4 Form Fields

| Field | Component | Required | Constraint |
|---|---|---|---|
| 书名 | Input | yes | maxLength=100 |
| 书号/ISBN | Input | yes | |
| 种类 | 自定义 Picker | yes | options from API, 同 club/add 模式 |
| 价格 | Input (type=digit) | yes | 数字键盘 |
| 新旧程度 | 自定义 Picker | no | options: 全新/几乎全新/有笔记/较旧, 默认"全新" |
| 描述 | Textarea | no | maxLength=500, autoHeight |

Picker 实现：自定义下拉（同 club/add），点击展开选项列表，选中后收起。

### 6.5 Image Grid

```
3 列宫格布局 (flex-wrap):

images.map(img => (
  <View> 图片 <View> × 按钮 </View> </View>
))
{images.length < 3 && !uploading && (
  <View> + </View>  // 虚线边框
)}
```

- 点击 "+"：
  1. `Taro.chooseImage({ count: 3 - images.length, sizeType: ['compressed'] })`
  2. 选中后逐个调用 `uploadBookImage(filePath)`
  3. 成功后 `setImages([...images, { url, imageId }])`
  4. 失败：toast "图片上传失败"，跳过该图
  5. 上传中 uploading=true，宫格位显示 loading

- 点击 "×"：
  1. 调用 `deleteBookImage(bookId, imageId)` — 新增模式下 bookId 传 null，service 层内部适配
  2. 成功后从 images 数组 splice 移除对应项
  3. 删除失败：toast 提示，不移除本地 state

### 6.6 Submit

```
必填校验: name.trim() && isbn.trim() && category && price.trim()
  → 不满足: 提交按钮灰色 (.submit-btn-disabled)
  → 满足: 提交按钮高亮蓝色

handleSubmit:
  → submitting = true
  → data = { name: trim, isbn: trim, category, price: trim, condition, description: trim, images }
  → id ? updateBook(id, data) : createBook(data)
  → 成功: toast success → setTimeout(navigateBack, 1500)
  → 失败: toast error
  → submitting = false

提交中按钮文字: "提交中..."
```

### 6.7 Header

```
┌─────────────────────────────┐
│  ←  发布书籍 / 编辑书籍      │  ← uniform-page-header
└─────────────────────────────┘
```

---

## 7. Styling Conventions

- 使用 CSS 文件（`.css`），与 club 模块一致
- CSS 自定义属性适配深色模式：`--color-bg-card`、`--color-text`、`--color-text-secondary`
- 单位优先使用 `rpx`
- 卡片：`border-radius: 16rpx`，`box-shadow`，`background: var(--color-bg-card, #fff)`
- 表单：`.form-group` / `.form-label` / `.form-input-wrap` / `.form-input`（沿用 club 样式类名）
- Header：`.uniform-page-header`（统一类名）
- 价格红色：`#e74c3c`
- 主题蓝：`#47a5fd`
- 条件标签色：全新 `#27ae60`、几乎全新 `#3498db`、有笔记 `#f39c12`、较旧 `#95a5a6`
- 提交按钮：蓝色 `#47a5fd`，禁用灰色 `#ccc`

---

## 8. Files Changed

### New Files (6)

1. `src/service/hbut/book.js` — Service 层
2. `src/modules/pages/book/index.css` — 列表样式
3. `src/modules/pages/book/detail/index.jsx` — 详情页
4. `src/modules/pages/book/detail/index.css` — 详情样式
5. `src/modules/pages/book/edit/index.jsx` — 编辑页
6. `src/modules/pages/book/edit/index.css` — 编辑样式

### Modified Files (5)

7. `src/modules/pages/book/index.jsx` — 重写为动态列表页
8. `src/app.config.js` — 添加 detail、edit 子包路由
9. `src/service/hbut/index.js` — 导出 book 函数
10. `src/service/index.js` — 统一导出 book 函数
11. `src/utils/serverRequest.h5.js` — 新增 `serverUpload`
12. `src/utils/serverRequest.weapp.js` — 新增 `serverUpload`
