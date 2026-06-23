# Book Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static book page with a full dynamic second-hand book module: list (search/filter/paginate), detail (swiper/want/edit), and add/edit form with image upload.

**Architecture:** Follows the existing club module pattern — service layer in `hbut/book.js` with cache-first strategy, three nested subpackage pages under `modules/pages/book/`, custom CSS with dark-mode variables, and JWT-auth'd API calls via `serverGet`/`serverPost`/new `serverUpload`.

**Tech Stack:** Taro 4.2, React 18, JavaScript, CSS, taro-ui (AtIcon, AtActivityIndicator)

## Global Constraints

- All API requests encapsulated in `src/service/hbut/book.js`, handling token, error codes, timeout uniformly
- List data cached via `cacheManager` (TTL 5 minutes). Show cache first, then silently refresh
- Pull-to-refresh via `ScrollView` `onRefresh`
- Max 3 images, use `Taro.chooseImage` + `Taro.uploadFile`, encapsulate upload in service layer
- All async operations use try/catch, errors toast, never crash or clear existing data
- Navigation: `navigationStyle: "custom"`, every page wrapped in `<SafeAreaView>`
- Header pattern: `<View className="uniform-page-header">` with back arrow + `<HeadStatus>`
- Styles: `.css` files, `rpx` units, `var(--color-bg-card)` etc. for dark mode

---

### Task 1: Add `serverUpload` to request utilities

**Files:**
- Modify: `src/utils/serverRequest.h5.js`
- Modify: `src/utils/serverRequest.weapp.js`

**Interfaces:**
- Produces: `serverUpload(url, filePath, params?) → Promise<object>` — exported from both platform files, used by `service/hbut/book.js` Task 2

- [ ] **Step 1: Add `serverUpload` to H5 serverRequest**

Add after the existing `serverPost` export in `src/utils/serverRequest.h5.js` (line 75):

```js
/**
 * 上传文件（H5 环境）
 * @param {string} url  如 "/api/v1/books/upload"
 * @param {string} filePath  本地临时文件路径
 * @param {object} params  额外 formData 字段
 * @returns {Promise<object>} 解析后的响应 JSON
 */
export async function serverUpload(url, filePath, params = {}) {
  const token = userManager.getServerToken();
  const header = {};
  if (token) {
    header["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await Taro.uploadFile({
      url: `${BASE_URL}${url}`,
      filePath,
      name: "file",
      formData: params,
      header,
    });

    const body = JSON.parse(res.data);

    if (res.statusCode >= 400) {
      if (res.statusCode === 401 || res.statusCode === 403) {
        userManager.setServerToken("");
      }
      throw new Error(
        (body && body.message) || `上传失败 (${res.statusCode})`,
      );
    }

    return body;
  } catch (error) {
    runtimeLogger.error(
      "ServerRequest",
      `UPLOAD ${url} 失败`,
      error?.message || error,
    );
    throw error;
  }
}
```

Also update the default export at line 77:

```js
export default { serverGet, serverPost, serverUpload };
```

- [ ] **Step 2: Add `serverUpload` to WeApp serverRequest**

Add after the existing `serverPost` export in `src/utils/serverRequest.weapp.js` (line 66):

```js
/**
 * 上传文件（微信小程序环境）
 * 小程序云函数有 body 大小限制，uploadFile 直接请求服务器
 */
export async function serverUpload(url, filePath, params = {}) {
  const token = userManager.getServerToken();
  const header = {};
  if (token) {
    header["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await Taro.uploadFile({
      url: `${SERVER_BASE}${url}`,
      filePath,
      name: "file",
      formData: params,
      header,
    });

    const body = JSON.parse(res.data);

    if (res.statusCode >= 400) {
      if (res.statusCode === 401 || res.statusCode === 403) {
        userManager.setServerToken("");
      }
      throw new Error(
        (body && body.message) || `上传失败 (${res.statusCode})`,
      );
    }

    return body;
  } catch (error) {
    runtimeLogger.error(
      "ServerRequest",
      `UPLOAD ${url} 失败`,
      error?.message || error,
    );
    throw error;
  }
}
```

Also update the default export at line 68:

```js
export default { serverGet, serverPost, serverUpload };
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/serverRequest.h5.js src/utils/serverRequest.weapp.js
git commit -m "feat: add serverUpload to request utilities

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Create `service/hbut/book.js`

**Files:**
- Create: `src/service/hbut/book.js`

**Interfaces:**
- Produces: 8 exported async functions consumed by Tasks 5, 6, 7
  - `getBookList({ page, pageSize, keyword, category }, forceRefresh?) → { books, total }`
  - `getBookCategories(forceRefresh?) → string[]`
  - `getBookDetail(id) → object`
  - `createBook(data) → { success, id }`
  - `updateBook(id, data) → { success }`
  - `toggleWantBook(id) → { success, isWanted }`
  - `uploadBookImage(filePath) → { url, imageId }`
  - `deleteBookImage(bookId, imageId) → { success }`

- [ ] **Step 1: Create the file**

Create `src/service/hbut/book.js`:

```js
// 二手书相关 API（从后端获取，带缓存）
import { serverGet, serverPost, serverUpload } from "../../utils/serverRequest";
import cacheManager from "../../utils/cache";
import runtimeLogger from "../../utils/runtimeLogger";

const CACHE_KEY_BOOKS = "v1_books";
const CACHE_KEY_CATEGORIES = "v1_book_categories";
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

/**
 * 获取书籍列表（分页 + 搜索 + 筛选）
 * @param {object} opts
 * @param {number} opts.page
 * @param {number} opts.pageSize
 * @param {string} opts.keyword
 * @param {string} opts.category  "全部" 表示不筛选
 * @param {boolean} forceRefresh
 * @returns {Promise<{ books: Array, total: number }>}
 */
export async function getBookList(
  { page = 1, pageSize = 20, keyword = "", category = "" } = {},
  forceRefresh = false,
) {
  if (!forceRefresh) {
    const cached = cacheManager.get(CACHE_KEY_BOOKS);
    if (cached && Array.isArray(cached.books)) {
      return cached;
    }
  }

  try {
    const params = { page, pageSize };
    if (keyword) params.keyword = keyword;
    if (category && category !== "全部") params.category = category;

    const res = await serverGet("/api/v1/books", params);
    const data = {
      books: (res && res.data) || [],
      total: (res && res.total) || 0,
    };

    // 只在无筛选条件时缓存首页
    if (!keyword && (!category || category === "全部") && page === 1) {
      cacheManager.set(CACHE_KEY_BOOKS, data, CACHE_TTL);
    }

    return data;
  } catch (error) {
    runtimeLogger.error("Books", "获取书籍列表失败", error);
    throw error;
  }
}

/**
 * 获取书籍分类
 * @param {boolean} forceRefresh
 * @returns {Promise<string[]>}
 */
export async function getBookCategories(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cacheManager.get(CACHE_KEY_CATEGORIES);
    if (cached && Array.isArray(cached)) return cached;
  }

  try {
    const res = await serverGet("/api/v1/books/categories");
    const data = (res && res.data) || [];
    const categories = ["全部", ...(Array.isArray(data) ? data : [])];
    cacheManager.set(CACHE_KEY_CATEGORIES, categories, CACHE_TTL);
    return categories;
  } catch (error) {
    runtimeLogger.error("Books", "获取书籍分类失败", error);
    throw error;
  }
}

/**
 * 获取书籍详情
 * @param {string|number} id
 * @returns {Promise<object>}
 */
export async function getBookDetail(id) {
  try {
    const res = await serverGet(`/api/v1/books/${id}`);
    if (res && res.data) return res.data;
    throw new Error("书籍不存在");
  } catch (error) {
    runtimeLogger.error("Books", "获取书籍详情失败", error);
    throw error;
  }
}

/**
 * 新增书籍
 * @param {object} data  { name, isbn, category, price, condition, description, images }
 * @returns {Promise<{ success: boolean, id: string }>}
 */
export async function createBook(data) {
  try {
    const res = await serverPost("/api/v1/books", data);
    if (res && res.success) {
      cacheManager.remove(CACHE_KEY_BOOKS);
    }
    return res;
  } catch (error) {
    runtimeLogger.error("Books", "新增书籍失败", error);
    throw error;
  }
}

/**
 * 更新书籍
 * @param {string|number} id
 * @param {object} data
 * @returns {Promise<{ success: boolean }>}
 */
export async function updateBook(id, data) {
  try {
    const res = await serverPost(`/api/v1/books/${id}`, data);
    if (res && res.success) {
      cacheManager.remove(CACHE_KEY_BOOKS);
    }
    return res;
  } catch (error) {
    runtimeLogger.error("Books", "更新书籍失败", error);
    throw error;
  }
}

/**
 * 切换"想要"状态
 * @param {string|number} id
 * @returns {Promise<{ success: boolean, isWanted: boolean }>}
 */
export async function toggleWantBook(id) {
  try {
    const res = await serverPost(`/api/v1/books/${id}/want`);
    return res;
  } catch (error) {
    runtimeLogger.error("Books", "切换想要状态失败", error);
    throw error;
  }
}

/**
 * 上传书籍图片
 * @param {string} filePath  本地临时文件路径
 * @returns {Promise<{ url: string, imageId: string }>}
 */
export async function uploadBookImage(filePath) {
  try {
    const res = await serverUpload("/api/v1/books/upload", filePath);
    if (!res || !res.url) {
      throw new Error((res && res.message) || "上传失败");
    }
    return res;
  } catch (error) {
    runtimeLogger.error("Books", "上传书籍图片失败", error);
    throw error;
  }
}

/**
 * 删除书籍图片
 * @param {string|number|null} bookId  新增模式下为 null
 * @param {string} imageId
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteBookImage(bookId, imageId) {
  try {
    const endpoint = bookId
      ? `/api/v1/books/${bookId}/images/${imageId}`
      : `/api/v1/books/images/${imageId}`;
    const res = await serverPost(endpoint, { _method: "DELETE" });
    return res;
  } catch (error) {
    runtimeLogger.error("Books", "删除书籍图片失败", error);
    throw error;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/service/hbut/book.js
git commit -m "feat: add book service layer with 8 API functions

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Wire up service exports

**Files:**
- Modify: `src/service/hbut/index.js`
- Modify: `src/service/index.js`

**Interfaces:**
- Consumes: exports from `./book.js` (Task 2)
- Produces: re-exports consumed by Tasks 5, 6, 7

- [ ] **Step 1: Add book exports to hbut/index.js**

Add after the existing club export line (line 14) in `src/service/hbut/index.js`:

```js
export { getAllClub, getClubCategories, getClubDetail, addClub } from './clubs';
export {
  getBookList, getBookCategories, getBookDetail,
  createBook, updateBook, toggleWantBook,
  uploadBookImage, deleteBookImage,
} from './book';
```

- [ ] **Step 2: Add book exports to service/index.js**

Add after the existing club exports (after line 19) in `src/service/index.js`:

```js
export const getBookList       = api('getBookList');
export const getBookCategories = api('getBookCategories');
export const getBookDetail     = api('getBookDetail');
export const createBook        = api('createBook');
export const updateBook        = api('updateBook');
export const toggleWantBook    = api('toggleWantBook');
export const uploadBookImage   = api('uploadBookImage');
export const deleteBookImage   = api('deleteBookImage');
```

- [ ] **Step 3: Commit**

```bash
git add src/service/hbut/index.js src/service/index.js
git commit -m "feat: wire up book service exports

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Register book subpackage routes

**Files:**
- Modify: `src/app.config.js`

**Interfaces:**
- Produces: routes `/modules/pages/book/detail/index` and `/modules/pages/book/edit/index` accessible via `Taro.navigateTo`

- [ ] **Step 1: Add routes to app.config.js**

In `src/app.config.js`, inside the `subPackages[0].pages` array, add after the existing `"pages/book/index"` line (line 54):

```js
"pages/book/index",
"pages/book/detail/index",
"pages/book/edit/index",
```

The surrounding context should look like:
```js
"pages/book/index",
"pages/book/detail/index",
"pages/book/edit/index",
"pages/runtimeLog/index",
```

- [ ] **Step 2: Commit**

```bash
git add src/app.config.js
git commit -m "feat: register book detail and edit subpackage routes

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Rewrite book list page

**Files:**
- Modify: `src/modules/pages/book/index.jsx`
- Create: `src/modules/pages/book/index.css`

**Interfaces:**
- Consumes: `getBookList`, `getBookCategories` from `../../../service` (Task 3)
- Consumes: `getColorFromName` from `../../../utils/getHashCode`
- Consumes: `cacheManager` from `../../../utils/cache`

- [ ] **Step 1: Replace index.jsx**

Replace the entire content of `src/modules/pages/book/index.jsx`:

```jsx
import { View, Text, Image, Input, ScrollView } from "@tarojs/components";
import Taro, { useLoad, useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { useState, useCallback, useRef } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import SafeAreaView from "../../../components/SafeAreaView";
import HeadStatus from "../../../components/HeadStatus";
import { getBookList, getBookCategories } from "../../../service";
import { getColorFromName } from "../../../utils/getHashCode";
import runtimeLogger from "../../../utils/runtimeLogger";
import "./index.css";

export default function Index() {
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState(["全部"]);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState("loading"); // 'cache'|'loading'|'error'|'done'|'empty'
  const [refreshing, setRefreshing] = useState(false);
  const debounceRef = useRef(null);

  const fetchList = useCallback(
    async (p = 1, kw = keyword, cat = activeCategory, append = false) => {
      try {
        const data = await getBookList(
          { page: p, pageSize: 20, keyword: kw, category: cat },
          p === 1 && !kw && cat === "全部", // 仅首页无筛选时 forceRefresh
        );
        if (append && p > 1) {
          setBooks((prev) => [...prev, ...(data.books || [])]);
        } else {
          setBooks(data.books || []);
        }
        setTotal(data.total || 0);
        setPage(p);
        const hasData = (data.books || []).length > 0;
        setLoading(hasData ? "done" : "empty");
      } catch (error) {
        runtimeLogger.error("BookList", "加载书籍列表失败", error);
        if (!append) {
          // 保留已有数据不覆盖
          setLoading(books.length === 0 ? "error" : "done");
        }
      }
    },
    [keyword, activeCategory, books.length],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await getBookCategories();
      setCategories(cats || ["全部"]);
    } catch {
      // 分类加载失败使用默认值，不阻塞列表
    }
  }, []);

  useLoad(() => {
    fetchCategories();
    fetchList(1);
  });

  useDidShow(() => {
    fetchList(1);
  });

  usePullDownRefresh(() => {
    fetchList(1).finally(() => Taro.stopPullDownRefresh());
  });

  const handleSearch = (value) => {
    setKeyword(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchList(1, value, activeCategory);
    }, 300);
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setLoading("loading");
    fetchList(1, keyword, cat);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchList(1).finally(() => setRefreshing(false));
  };

  const handleLoadMore = () => {
    if (books.length >= total) return;
    fetchList(page + 1, keyword, activeCategory, true);
  };

  const handleRetry = () => {
    setLoading("loading");
    fetchList(1);
  };

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
        />
        <HeadStatus text="二手书" />
      </View>

      {/* 搜索栏 */}
      <View className="search-bar">
        <View className="search-input-wrap">
          <AtIcon value="search" size={16} color="#999" />
          <Input
            className="search-input"
            placeholder="搜索书名/书号"
            value={keyword}
            onInput={(e) => handleSearch(e.detail.value)}
          />
        </View>
      </View>

      {/* 类别筛选 */}
      <ScrollView scrollX className="category-scroll" enhanced bounces={false}>
        <View className="category-list">
          {categories.map((cat) => (
            <View
              key={cat}
              className={`category-tag ${activeCategory === cat ? "category-tag-active" : ""}`}
              onClick={() => handleCategoryChange(cat)}
            >
              <Text>{cat}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 列表 */}
      {loading === "loading" && books.length === 0 ? (
        <View className="skeleton-list">
          {[1, 2, 3].map((i) => (
            <View key={i} className="book-card skeleton-card">
              <View className="card-thumb skeleton-thumb" />
              <View className="card-info">
                <View className="skeleton-line skeleton-line-long" />
                <View className="skeleton-line skeleton-line-short" />
              </View>
            </View>
          ))}
        </View>
      ) : loading === "error" && books.length === 0 ? (
        <View className="empty-view" onClick={handleRetry}>
          <Text className="empty-text">加载失败，点击重试</Text>
        </View>
      ) : loading === "empty" ? (
        <View className="empty-view">
          <Text className="empty-text">暂无书籍</Text>
        </View>
      ) : (
        <ScrollView
          scrollY
          className="book-list"
          onScrollToLower={handleLoadMore}
          lowerThreshold={80}
          refresherEnabled
          refresherTriggered={refreshing}
          onRefresherRefresh={handleRefresh}
          enhanced
          bounces={false}
        >
          {books.map((book) => (
            <View
              key={book.id}
              className="book-card"
              onClick={() =>
                Taro.navigateTo({
                  url: `/modules/pages/book/detail/index?id=${book.id}`,
                })
              }
            >
              <View
                className="card-thumb"
                style={{
                  background: getColorFromName(book.name || "书"),
                }}
              >
                {book.images && book.images.length > 0 ? (
                  <Image
                    className="thumb-img"
                    src={book.images[0].url}
                    mode="aspectFill"
                  />
                ) : (
                  <Text className="thumb-placeholder">
                    {(book.name || "书")[0]}
                  </Text>
                )}
              </View>
              <View className="card-info">
                <Text className="card-name">{book.name}</Text>
                <Text className="card-price">¥{book.price}</Text>
                <View className="card-meta">
                  <Text className="card-publisher">{book.publisherName}</Text>
                  {book.category && (
                    <>
                      <Text className="meta-dot">·</Text>
                      <Text className="meta-tag">{book.category}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          ))}
          {books.length >= total && books.length > 0 && (
            <View className="list-footer">
              <Text className="footer-text">— 已加载全部 —</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB 悬浮按钮 */}
      <View
        className="fab-btn"
        onClick={() =>
          Taro.navigateTo({ url: "/modules/pages/book/edit/index" })
        }
      >
        <Text className="fab-text">+</Text>
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Create index.css**

Create `src/modules/pages/book/index.css`:

```css
/* 搜索栏 */
.search-bar {
  padding: 0 24rpx;
  margin-top: 12rpx;
  flex-shrink: 0;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: var(--color-bg-card, #fff);
  border-radius: 36rpx;
  padding: 0 24rpx;
  height: 68rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.search-input {
  flex: 1;
  margin-left: 12rpx;
  font-size: 28rpx;
  color: var(--color-text, #333);
  height: 100%;
}

/* 类别筛选 */
.category-scroll {
  width: 100%;
  white-space: nowrap;
  padding: 16rpx 0;
  margin-top: 8rpx;
  flex-shrink: 0;
}

.category-list {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  padding: 0 24rpx;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 24rpx;
  border-radius: 30rpx;
  background: var(--color-bg-card, #e8e8e8);
  font-size: 26rpx;
  color: var(--color-text-secondary, #666);
  flex-shrink: 0;
}

.category-tag-active {
  background: #47a5fd;
  color: #fff;
}

/* 列表 */
.book-list {
  flex: 1;
  padding: 12rpx 24rpx 0;
  box-sizing: border-box;
}

.book-card {
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  background: var(--color-bg-card, #fff);
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.card-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 20rpx;
  overflow: hidden;
}

.thumb-img {
  width: 100%;
  height: 100%;
}

.thumb-placeholder {
  font-size: 48rpx;
  color: #fff;
  font-weight: bold;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.card-name {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-text, #2c3e50);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-price {
  font-size: 32rpx;
  color: #e74c3c;
  font-weight: bold;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-wrap: wrap;
}

.card-publisher {
  font-size: 24rpx;
  color: var(--color-text-secondary, #99a);
}

.meta-dot {
  font-size: 22rpx;
  color: #ddd;
}

.meta-tag {
  font-size: 22rpx;
  color: var(--color-text-secondary, #99a);
  background: var(--color-primary-light, #e8f4fd);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

/* Skeleton */
.skeleton-list {
  flex: 1;
  padding: 12rpx 24rpx 0;
}

.skeleton-card {
  background: var(--color-bg-card, #f0f0f0);
}

.skeleton-thumb {
  background: #e8e8e8;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-line {
  height: 24rpx;
  background: #e8e8e8;
  border-radius: 6rpx;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-line-long {
  width: 280rpx;
}

.skeleton-line-short {
  width: 160rpx;
  margin-top: 12rpx;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* 空状态 / 错误 */
.empty-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 列表底部 */
.list-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0 40rpx;
}

.footer-text {
  font-size: 24rpx;
  color: #ccc;
}

/* FAB */
.fab-btn {
  position: fixed;
  right: 40rpx;
  bottom: 140rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #47a5fd 0%, #6db9ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 24rpx rgba(71, 165, 253, 0.35);
  z-index: 100;
}

.fab-text {
  font-size: 56rpx;
  color: #fff;
  line-height: 1;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/pages/book/index.jsx src/modules/pages/book/index.css
git commit -m "feat: rewrite book list page with search, filter, pagination

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Create book detail page

**Files:**
- Create: `src/modules/pages/book/detail/index.jsx`
- Create: `src/modules/pages/book/detail/index.css`
- Create: `src/modules/pages/book/detail/index.config.js`

**Interfaces:**
- Consumes: `getBookDetail`, `toggleWantBook` from `../../../../service` (Task 3)
- Route params: `id` from `Taro.useRouter().params`

- [ ] **Step 1: Create detail/index.config.js**

Create `src/modules/pages/book/detail/index.config.js`:

```js
export default definePageConfig({
  navigationBarTitleText: "书籍详情",
  navigationStyle: "custom",
});
```

- [ ] **Step 2: Create detail/index.jsx**

Create `src/modules/pages/book/detail/index.jsx`:

```jsx
import { View, Text, Image, Swiper, SwiperItem } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import { useState } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import SafeAreaView from "../../../../components/SafeAreaView";
import HeadStatus from "../../../../components/HeadStatus";
import { getBookDetail, toggleWantBook } from "../../../../service";
import runtimeLogger from "../../../../utils/runtimeLogger";
import "./index.css";

const CONDITION_MAP = ["全新", "几乎全新", "有笔记", "较旧"];
const CONDITION_COLORS = {
  全新: "#27ae60",
  几乎全新: "#3498db",
  有笔记: "#f39c12",
  较旧: "#95a5a6",
};

export default function Index() {
  const router = Taro.useRouter();
  const { id } = router.params;

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wantLoading, setWantLoading] = useState(false);

  useLoad(() => {
    if (!id) {
      Taro.showToast({ title: "无效的书籍", icon: "none" });
      Taro.navigateBack();
      return;
    }

    (async () => {
      try {
        const data = await getBookDetail(id);
        if (data) {
          setBook(data);
        } else {
          Taro.showToast({ title: "书籍不存在", icon: "none" });
          Taro.navigateBack();
        }
      } catch (error) {
        runtimeLogger.error("BookDetail", "获取书籍详情失败", error);
        Taro.showToast({ title: "加载失败", icon: "none" });
        Taro.navigateBack();
      } finally {
        setLoading(false);
      }
    })();
  });

  const handleWant = async () => {
    if (wantLoading) return;
    setWantLoading(true);
    try {
      const res = await toggleWantBook(id);
      if (res && res.success) {
        setBook({ ...book, isWanted: res.isWanted });
      }
    } catch (error) {
      Taro.showToast({ title: "操作失败", icon: "none" });
    } finally {
      setWantLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <AtIcon
            value="arrow-left"
            color="#ffffff"
            onClick={() => Taro.navigateBack()}
          />
          <HeadStatus text="书籍详情" />
        </View>
        <View className="loading-view">
          <AtActivityIndicator isOpened size={32} mode="center" />
        </View>
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <AtIcon
            value="arrow-left"
            color="#ffffff"
            onClick={() => Taro.navigateBack()}
          />
          <HeadStatus text="书籍详情" />
        </View>
        <View className="empty-view">
          <Text>书籍数据为空</Text>
        </View>
      </SafeAreaView>
    );
  }

  const images = book.images || [];

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.navigateBack()}
        />
        <HeadStatus text="书籍详情" />
      </View>

      <View className="detail-scroll">
        {/* 轮播图 */}
        {images.length > 0 ? (
          <Swiper
            className="detail-swiper"
            indicatorDots
            indicatorColor="rgba(255,255,255,0.5)"
            indicatorActiveColor="#fff"
            circular
          >
            {images.map((img, idx) => (
              <SwiperItem key={idx}>
                <Image
                  className="swiper-img"
                  src={img.url}
                  mode="aspectFill"
                />
              </SwiperItem>
            ))}
          </Swiper>
        ) : (
          <View className="detail-swiper detail-swiper-empty">
            <Text className="swiper-empty-text">暂无图片</Text>
          </View>
        )}

        {/* 信息区 */}
        <View className="detail-section">
          <Text className="detail-name">{book.name}</Text>
          <Text className="detail-price">¥{book.price}</Text>
        </View>

        <View className="detail-section">
          <View className="detail-row">
            <Text className="detail-label">ISBN</Text>
            <Text className="detail-value">{book.isbn || "暂无"}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">类别</Text>
            <Text className="detail-value">{book.category || "未分类"}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">发布人</Text>
            <Text className="detail-value">
              {book.publisherName || "未知"}
            </Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">发布时间</Text>
            <Text className="detail-value">
              {book.publishTime || "未知"}
            </Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">新旧程度</Text>
            <Text
              className="condition-tag"
              style={{
                background: CONDITION_COLORS[book.condition] || "#95a5a6",
              }}
            >
              {book.condition || "未知"}
            </Text>
          </View>
        </View>

        {book.description ? (
          <View className="detail-section">
            <Text className="detail-section-title">描述</Text>
            <Text className="detail-section-content">{book.description}</Text>
          </View>
        ) : null}

        {/* 底部留白给固定栏 */}
        <View style={{ height: "120rpx" }} />
      </View>

      {/* 底部固定栏 */}
      <View className="bottom-bar">
        <View
          className={`want-btn ${book.isWanted ? "want-btn-active" : ""}`}
          onClick={handleWant}
        >
          <Text className="want-btn-text">
            {wantLoading ? "..." : book.isWanted ? "已想要" : "想要"}
          </Text>
        </View>
        {book.isPublisher && (
          <View
            className="edit-btn"
            onClick={() =>
              Taro.navigateTo({
                url: `/modules/pages/book/edit/index?id=${id}`,
              })
            }
          >
            <Text className="edit-btn-text">编辑</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Create detail/index.css**

Create `src/modules/pages/book/detail/index.css`:

```css
.detail-scroll {
  flex: 1;
  overflow-y: auto;
}

/* 轮播图 */
.detail-swiper {
  width: 100%;
  height: 480rpx;
  background: #e8e8e8;
}

.detail-swiper-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 320rpx;
}

.swiper-img {
  width: 100%;
  height: 100%;
}

.swiper-empty-text {
  font-size: 30rpx;
  color: #999;
}

/* 信息区 */
.detail-section {
  margin: 24rpx 24rpx 0;
  background: var(--color-bg-card, #fff);
  border-radius: 16rpx;
  padding: 24rpx;
}

.detail-name {
  font-size: 38rpx;
  font-weight: bold;
  color: var(--color-text, #2c3e50);
  display: block;
}

.detail-price {
  font-size: 36rpx;
  color: #e74c3c;
  font-weight: bold;
  display: block;
  margin-top: 12rpx;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 28rpx;
  color: var(--color-text-secondary, #888);
  width: 150rpx;
  flex-shrink: 0;
}

.detail-value {
  font-size: 28rpx;
  color: var(--color-text, #333);
  flex: 1;
}

.condition-tag {
  font-size: 24rpx;
  color: #fff;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  display: inline-block;
}

.detail-section-title {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--color-text, #333);
  margin-bottom: 12rpx;
  border-left: 6rpx solid #47a5fd;
  padding-left: 16rpx;
}

.detail-section-content {
  font-size: 28rpx;
  color: var(--color-text-secondary, #555);
  line-height: 1.7;
}

/* Loading / Empty */
.loading-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 28rpx;
}

/* 底部固定栏 */
.bottom-bar {
  width: 100%;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: var(--color-bg-card, #fff);
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-sizing: border-box;
  flex-shrink: 0;
}

.want-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  border: 2px solid #e74c3c;
  display: flex;
  align-items: center;
  justify-content: center;
}

.want-btn-active {
  background: #e74c3c;
}

.want-btn-text {
  font-size: 30rpx;
  color: #e74c3c;
  font-weight: bold;
}

.want-btn-active .want-btn-text {
  color: #fff;
}

.edit-btn {
  width: 160rpx;
  height: 80rpx;
  border-radius: 40rpx;
  background: #47a5fd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.edit-btn-text {
  font-size: 30rpx;
  color: #fff;
  font-weight: bold;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/pages/book/detail/
git commit -m "feat: add book detail page with swiper, info, and want/edit bar

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Create book add/edit page

**Files:**
- Create: `src/modules/pages/book/edit/index.jsx`
- Create: `src/modules/pages/book/edit/index.css`
- Create: `src/modules/pages/book/edit/index.config.js`

**Interfaces:**
- Consumes: `getBookDetail`, `getBookCategories`, `createBook`, `updateBook`, `uploadBookImage`, `deleteBookImage` from `../../../../service` (Task 3)
- Route params: `id` (optional, absent = new mode)

- [ ] **Step 1: Create edit/index.config.js**

Create `src/modules/pages/book/edit/index.config.js`:

```js
export default definePageConfig({
  navigationBarTitleText: "发布书籍",
  navigationStyle: "custom",
});
```

- [ ] **Step 2: Create edit/index.jsx**

Create `src/modules/pages/book/edit/index.jsx`:

```jsx
import { View, Text, Input, Textarea, ScrollView, Image } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import { useState } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import SafeAreaView from "../../../../components/SafeAreaView";
import HeadStatus from "../../../../components/HeadStatus";
import {
  getBookDetail,
  getBookCategories,
  createBook,
  updateBook,
  uploadBookImage,
  deleteBookImage,
} from "../../../../service";
import runtimeLogger from "../../../../utils/runtimeLogger";
import "./index.css";

const CONDITION_OPTIONS = ["全新", "几乎全新", "有笔记", "较旧"];

export default function Index() {
  const router = Taro.useRouter();
  const editId = router.params.id || "";

  const [name, setName] = useState("");
  const [isbn, setIsbn] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("全新");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]); // [{ url, imageId }]
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [showCondPicker, setShowCondPicker] = useState(false);

  const isEdit = !!editId;

  useLoad(() => {
    (async () => {
      // 获取分类
      try {
        const cats = await getBookCategories();
        // 去掉"全部"，只保留实际分类
        setCategoryOptions(
          (cats || []).filter((c) => c !== "全部"),
        );
      } catch {
        // 分类加载失败不阻塞
      }

      // 编辑模式预填
      if (isEdit) {
        try {
          const data = await getBookDetail(editId);
          if (data) {
            setName(data.name || "");
            setIsbn(data.isbn || "");
            setCategory(data.category || "");
            setPrice(data.price != null ? String(data.price) : "");
            setCondition(data.condition || "全新");
            setDescription(data.description || "");
            setImages(data.images || []);
          }
        } catch (error) {
          runtimeLogger.error("BookEdit", "获取书籍详情失败", error);
          Taro.showToast({ title: "加载失败", icon: "none" });
        }
      }
      setFetched(true);
    })();
  });

  const handleChooseImage = () => {
    const count = 3 - images.length;
    if (count <= 0) return;

    Taro.chooseImage({
      count,
      sizeType: ["compressed"],
      success: async (res) => {
        setUploading(true);
        for (const filePath of res.tempFilePaths) {
          try {
            const result = await uploadBookImage(filePath);
            if (result && result.url) {
              setImages((prev) => [
                ...prev,
                { url: result.url, imageId: result.imageId },
              ]);
            }
          } catch {
            Taro.showToast({ title: "图片上传失败", icon: "none" });
          }
        }
        setUploading(false);
      },
    });
  };

  const handleDeleteImage = async (index) => {
    const img = images[index];
    try {
      await deleteBookImage(isEdit ? editId : null, img.imageId);
      setImages((prev) => prev.filter((_, i) => i !== index));
    } catch {
      Taro.showToast({ title: "删除失败", icon: "none" });
    }
  };

  const canSubmit =
    name.trim() && isbn.trim() && category && price.trim();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    const data = {
      name: name.trim(),
      isbn: isbn.trim(),
      category,
      price: price.trim(),
      condition,
      description: description.trim(),
      images,
    };

    setSubmitting(true);
    try {
      const res = isEdit
        ? await updateBook(editId, data)
        : await createBook(data);

      if (res && res.success) {
        Taro.showToast({ title: isEdit ? "更新成功" : "发布成功", icon: "success" });
        setTimeout(() => Taro.navigateBack(), 1500);
      } else {
        Taro.showToast({
          title: (res && res.message) || "操作失败",
          icon: "none",
        });
      }
    } catch (error) {
      runtimeLogger.error("BookEdit", "提交书籍失败", error);
      Taro.showToast({
        title: error.message || "提交失败，请稍后重试",
        icon: "none",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!fetched) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <AtIcon
            value="arrow-left"
            color="#ffffff"
            onClick={() => Taro.navigateBack()}
          />
          <HeadStatus text={isEdit ? "编辑书籍" : "发布书籍"} />
        </View>
        <View className="loading-view">
          <AtActivityIndicator isOpened size={32} mode="center" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.navigateBack()}
        />
        <HeadStatus text={isEdit ? "编辑书籍" : "发布书籍"} />
      </View>

      <ScrollView scrollY className="form-scroll" enhanced bounces={false}>
        {/* 书名 */}
        <View className="form-group">
          <Text className="form-label">书名 *</Text>
          <View className="form-input-wrap">
            <Input
              className="form-input"
              placeholder="请输入书名"
              value={name}
              onInput={(e) => setName(e.detail.value)}
              maxlength={100}
            />
          </View>
        </View>

        {/* 书号/ISBN */}
        <View className="form-group">
          <Text className="form-label">书号/ISBN *</Text>
          <View className="form-input-wrap">
            <Input
              className="form-input"
              placeholder="请输入书号或ISBN"
              value={isbn}
              onInput={(e) => setIsbn(e.detail.value)}
              maxlength={50}
            />
          </View>
        </View>

        {/* 种类 */}
        <View className="form-group">
          <Text className="form-label">种类 *</Text>
          <View
            className="form-picker"
            onClick={() => setShowCatPicker(!showCatPicker)}
          >
            <Text className={`picker-value ${!category ? "picker-placeholder" : ""}`}>
              {category || "请选择种类"}
            </Text>
            <AtIcon
              value={showCatPicker ? "chevron-up" : "chevron-down"}
              size={16}
              color="#999"
            />
          </View>
          {showCatPicker && (
            <View className="picker-options">
              {categoryOptions.map((cat) => (
                <View
                  key={cat}
                  className={`picker-option ${category === cat ? "picker-option-active" : ""}`}
                  onClick={() => {
                    setCategory(cat);
                    setShowCatPicker(false);
                  }}
                >
                  <Text>{cat}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 价格 */}
        <View className="form-group">
          <Text className="form-label">价格 *</Text>
          <View className="form-input-wrap">
            <Text className="price-prefix">¥</Text>
            <Input
              className="form-input"
              type="digit"
              placeholder="请输入价格"
              value={price}
              onInput={(e) => setPrice(e.detail.value)}
            />
          </View>
        </View>

        {/* 新旧程度 */}
        <View className="form-group">
          <Text className="form-label">新旧程度</Text>
          <View
            className="form-picker"
            onClick={() => setShowCondPicker(!showCondPicker)}
          >
            <Text className="picker-value">{condition}</Text>
            <AtIcon
              value={showCondPicker ? "chevron-up" : "chevron-down"}
              size={16}
              color="#999"
            />
          </View>
          {showCondPicker && (
            <View className="picker-options">
              {CONDITION_OPTIONS.map((opt) => (
                <View
                  key={opt}
                  className={`picker-option ${condition === opt ? "picker-option-active" : ""}`}
                  onClick={() => {
                    setCondition(opt);
                    setShowCondPicker(false);
                  }}
                >
                  <Text>{opt}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 描述 */}
        <View className="form-group">
          <Text className="form-label">描述</Text>
          <Textarea
            className="form-textarea"
            placeholder="请输入书籍描述（选填）"
            value={description}
            onInput={(e) => setDescription(e.detail.value)}
            maxlength={500}
            autoHeight
          />
        </View>

        {/* 图片区 */}
        <View className="form-group">
          <Text className="form-label">图片（最多3张）</Text>
          <View className="image-grid">
            {images.map((img, idx) => (
              <View key={idx} className="image-item">
                <Image
                  className="image-thumb"
                  src={img.url}
                  mode="aspectFill"
                />
                <View
                  className="image-delete"
                  onClick={() => handleDeleteImage(idx)}
                >
                  <Text className="image-delete-icon">×</Text>
                </View>
              </View>
            ))}
            {images.length < 3 && !uploading && (
              <View className="image-add" onClick={handleChooseImage}>
                <Text className="image-add-icon">+</Text>
              </View>
            )}
            {uploading && (
              <View className="image-add image-uploading">
                <AtActivityIndicator isOpened size={24} mode="center" />
              </View>
            )}
          </View>
        </View>

        {/* 提交按钮 */}
        <View className="form-group">
          <View
            className={`submit-btn ${!canSubmit || submitting ? "submit-btn-disabled" : ""}`}
            onClick={handleSubmit}
          >
            <Text className="submit-text">
              {submitting ? "提交中..." : isEdit ? "保存修改" : "发布"}
            </Text>
          </View>
        </View>

        <View style={{ height: "60rpx" }} />
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 3: Create edit/index.css**

Create `src/modules/pages/book/edit/index.css`:

```css
.loading-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-scroll {
  flex: 1;
  padding: 20rpx 0;
}

.form-group {
  margin-bottom: 24rpx;
  padding: 0 24rpx;
}

.form-label {
  font-size: 28rpx;
  color: var(--color-text, #333);
  font-weight: bold;
  margin-bottom: 12rpx;
  display: block;
}

.form-input-wrap {
  width: 100%;
  height: 80rpx;
  background: var(--color-bg-card, #f5f7fa);
  border-radius: 12rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  color: var(--color-text, #333);
  height: 100%;
}

.price-prefix {
  font-size: 28rpx;
  color: #e74c3c;
  font-weight: bold;
  margin-right: 4rpx;
}

.form-textarea {
  background: var(--color-bg-card, #f5f7fa);
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: var(--color-text, #333);
  min-height: 160rpx;
  width: 100%;
  box-sizing: border-box;
}

.form-picker {
  height: 80rpx;
  background: var(--color-bg-card, #f5f7fa);
  border-radius: 12rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.picker-value {
  font-size: 28rpx;
  color: var(--color-text, #333);
}

.picker-placeholder {
  color: #999;
}

.picker-options {
  margin-top: 8rpx;
  background: var(--color-bg-card, #fff);
  border-radius: 12rpx;
  border: 1px solid #eee;
  overflow: hidden;
}

.picker-option {
  height: 80rpx;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: var(--color-text, #333);
  border-bottom: 1px solid #f0f0f0;
}

.picker-option:last-child {
  border-bottom: none;
}

.picker-option-active {
  background: #e8f4fd;
  color: #47a5fd;
}

/* 图片网格 */
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
  position: relative;
}

.image-thumb {
  width: 100%;
  height: 100%;
}

.image-delete {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-delete-icon {
  color: #fff;
  font-size: 28rpx;
  font-weight: bold;
  line-height: 1;
}

.image-add {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  border: 2px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-add-icon {
  font-size: 60rpx;
  color: #ccc;
  line-height: 1;
}

.image-uploading {
  border-style: solid;
}

/* 提交按钮 */
.submit-btn {
  margin-top: 40rpx;
  height: 88rpx;
  background: #47a5fd;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn-disabled {
  background: #ccc;
}

.submit-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/modules/pages/book/edit/
git commit -m "feat: add book edit page with form, custom pickers, and image grid

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task Dependency Graph

```
Task 1 (serverUpload)
  └→ Task 2 (service/hbut/book.js)
       └→ Task 3 (service exports)
            └→ Tasks 5, 6, 7 (pages)

Task 4 (routes) — independent, parallel with Tasks 1-3
```

**Execution order**: 1 → 2 → 3, then 4 + 5 + 6 + 7 in parallel.
