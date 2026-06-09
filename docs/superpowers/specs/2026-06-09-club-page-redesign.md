# Design: 社团页面重做

**Date:** 2026-06-09
**Status:** draft

---

## Overview

完全重写社团页面 (`src/modules/pages/club`)，从旧的 `opendiffRequest` API 迁移到 V1 服务器 API，新增鉴权流程、详情页、添加社团功能。

---

## 1. Backend (`main.go`)

新增一条路由（handler 已存在，路由缺失）：

```go
v1Auth.POST("/clubs", handlers.V1CreateClub())
```

已有路由无需改动：
- `GET  /api/v1/clubs`     → `V1GetClubs()`
- `GET  /api/v1/clubs/:id` → `V1GetClubByID()`

---

## 2. 数据模型

### ClubWithPrincipal (后端返回)
| Field | Type | JSON key | Note |
|-------|------|----------|------|
| id | int | id | |
| name | string | name | |
| introduction | *string | introduction | nullable |
| activities | *string | activities | JSON array string or plain text |
| category | *string | category | e.g. "学术科技类" |
| image_url | *string | image_url | empty → use avatar fallback |
| nature | int | nature | 0=社团, 1=学生会, 2=其他 |
| schoolId | string | schoolId | |
| contact | *string | contact | nullable → display "无" |
| principal_id | *int | principal_id | |
| principal_name | string | principal_name | |

### 种类列表（硬编码）
```js
["全部", "学术科技类", "创新创业类", "文化艺术类", "体育活动类", "志愿公益类", "思想政治类", "其他"]
```
在页面加载时写入 cache (`club_categories`)，后续从缓存读取。

---

## 3. 鉴权流程

页面进入时（`useDidShow`）：
1. `userManager.checkLogin()` → false → 显示 "请先登录"（复用课表页 `notLoginView` 样式）
2. `userManager.getServerToken()` → 空 → 显示 "请先注册"
3. 均通过 → 加载社团数据

状态使用 `useState(null)` 三态模式（与课表页 `isLoggedIn` 模式一致）。

---

## 4. 页面布局

### 4a. 主页面 (`index.jsx`)

```
┌─ Header: ← 社团 ──────────────────┐
├─ Banner (Swiper placeholder) ─────┤  固定高度 280rpx，浅灰背景
├─ Category tabs (horizontal scroll)┤  选中高亮
├─ Club cards (vertical scroll) ────┤
│  ┌─ [头像] 名称 (bold) ──────────┐│
│  │        类型 | 性质 | 学校     ││
│  └──────────────────────────────┘│
├───────────────────────────────────┤
│                               [+] │  FAB，右下角固定
└───────────────────────────────────┘
```

**Banner:** Swiper 组件，文字占位 "轮播图区域"，背景 `#eee`，高度 280rpx。

**Category 筛选器:** 横向 `ScrollView`。选中标签背景 `#47a5fd` 白色文字，未选中灰色背景。

**卡片组件:**
- 左侧：圆形头像，直径 80rpx。图片 URL 有效 → 显示图片；无效/空 → 显示名称首字，背景色由 `getColorFromName(name)` 生成。
- 右侧：名称 (bold) + 类型 / 性质文字 / schoolId。
- 点击 → `Taro.navigateTo({ url: "/modules/pages/club/detail/index?id={id}" })`

### 4b. 详情页 (`detail/index.jsx`)

新子包页面，路由 `modules/pages/club/detail/index`。

接收 `id` 参数，调用 `GET /api/v1/clubs/:id`。

```
┌─ Header: ← 社团详情 ──────────────┐
├─ [社团图片暂缺] (占位，居中) ─────┤
├─ 名称 (大号粗体)                  │
├─ 学校: {schoolId}                 │
├─ 性质: 社团/学生会/其他           │
├─ 类型: {category}                 │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
├─ 介绍                            │
├─ {introduction}                  │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
├─ 活动                            │
├─ • {activity 1}                  │
├─ • {activity 2}                  │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
├─ 负责人: {principal_name}        │
├─ 联系方式: {contact 或 "无"}     │
└──────────────────────────────────┘
```

### 4c. 添加社团 (`add/index.jsx`)

表单页，路由 `modules/pages/club/add/index`。

**字段:**
| Field | Component | Required |
|-------|-----------|----------|
| name | Input | ✅ |
| category | Picker (7 categories) | ✅ |
| nature | Picker (社团/学生会/其他) | ✅ |
| introduction | Textarea | No |
| activities | Textarea | No |
| contact | Input | No |

Submit → `POST /api/v1/clubs` with JSON body. `schoolId` from `userManager.getSchoolId()`.

**FAB 按钮:** `position: fixed`, `right: 30rpx`, `bottom: 120rpx`, width 100rpx, border-radius 50%, `#47a5fd` bg, white "+" text, box-shadow.

---

## 5. 数据流

所有请求使用 `serverGet`/`serverPost`（与拓展开关功能一致）：
- `serverGet("/api/v1/clubs")` → 社团列表
- `serverGet("/api/v1/clubs/:id")` → 社团详情
- `serverPost("/api/v1/clubs", data)` → 创建社团

认证通过 URL 路径判断（后端 middleware 根据路由决定是否校验 token），token 由 `serverRequest` 自动注入。

---

## 6. 文件变更清单

| File | Action | Description |
|------|--------|-------------|
| `main.go` | Modify | Add `POST /clubs` v1 route |
| `src/modules/pages/club/index.jsx` | Rewrite | Auth gate + banner + category filter + card list + FAB |
| `src/modules/pages/club/index.css` | Rewrite | All new styles |
| `src/modules/pages/club/index.config.js` | Modify | Update page config |
| `src/modules/pages/club/detail/index.jsx` | Create | Club detail page |
| `src/modules/pages/club/detail/index.css` | Create | Detail page styles |
| `src/modules/pages/club/detail/index.config.js` | Create | Detail page config |
| `src/modules/pages/club/add/index.jsx` | Create | Add club form page |
| `src/modules/pages/club/add/index.css` | Create | Add page styles |
| `src/modules/pages/club/add/index.config.js` | Create | Add page config |
| `src/app.config.js` | Modify | Add `modules/pages/club/detail/index` and `modules/pages/club/add/index` to subPackages |

---

## 7. 错误处理

| 场景 | 处理 |
|------|------|
| 网络超时/异常 | Toast "网络连接失败"，显示已有数据（如有缓存） |
| 接口 4xx | 显示服务端 message |
| GET clubs 返回空数组 | 显示 "暂无社团数据" |
| 详情页 club 不存在 | Toast + navigateBack |
| 创建社团失败 | Toast 具体错误（"名称重复""内容不完整"等） |
| 用户已有社团 | 后端返回 error → Toast 提示 |
| activities 字段解析失败 | 原样显示 |
