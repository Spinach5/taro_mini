# Design: 设置页"拓展"开关 — 用户注册状态检查与注册流程

**Date:** 2026-06-09
**Status:** draft

---

## Overview

将设置页的"拓展"开关从纯本地状态改为需要服务器注册的功能。用户打开开关时：
1. 向服务器检查该用户是否已注册（GET `/api/v1/auth/check-user`）
2. 未注册则弹窗确认 → 同意后调用注册接口（POST `/api/v1/auth/register`）
3. 注册成功后存储 JWT token，供后续需认证的 API 使用

后端接口已存在（`main.go` 的 `/api/v1` 路由组），无需后端改动。

---

## 1. UserManager 扩展 (`src/service/userInfo.js`)

添加两个新字段，参与现有的 persist/sync 机制：

| Field | Type | Default | Cache key | Purpose |
|-------|------|---------|-----------|---------|
| `schoolId` | string | `""` | `schoolId` | 学校代码，当前为 `"hbut"` |
| `serverToken` | string | `""` | `serverToken` | 注册后返回的 JWT token |

两者均通过 `saveToCache()` / `applyValues()` 持久化，与现有字段一致。

新增方法：`setServerToken(token)`，`getServerToken()`，`setSchoolId(id)`。

---

## 2. 平台请求层 (`src/utils/serverRequest`)

采用 Taro 平台条件文件模式（与现有 `request.h5.js` / `request.weapp.js` 一致）。

### 2a. H5 (`src/utils/serverRequest.h5.js`)

```js
// 基于 axios + TaroAdapter，baseURL = "/server"（走 Vite proxy）
// GET  /api/v1/auth/check-user → /server/api/v1/auth/check-user
// POST /api/v1/auth/register    → /server/api/v1/auth/register
```

Proxy 已在 `config/index.js:100-128` 配置（`/server` → `https://8.148.69.248/`），无需改动。
生产环境需自行部署反向代理。

导出：`serverRequest` 实例（或 `serverGet`/`serverPost` 便捷方法）。
当 userManager 存有 token 时，通过 axios 拦截器注入 `Authorization: Bearer <token>`。

### 2b. WeApp (`src/utils/serverRequest.weapp.js`)

```js
// 通过 wx.cloud.callFunction("serverProxy", { path, method, data }) 转发
```

云函数 `serverProxy` 需单独部署，逻辑：
- 接收 `{ path, method, data }`
- 向 `https://8.148.69.248/api/v1/{path}` 发起 HTTP 请求
- 原样返回响应

导出：与 H5 端相同的接口（`serverRequest` 实例或 `serverGet`/`serverPost`）。

### 2c. 注意

`check-user` 和 `register` 均为公开接口，无需 token。token 注入为后续接口（如 clubs、books）预留，本次实现中暂不使用但应做好基础。

---

## 3. API 配置 (`src/config/api.js`)

现有配置已足够：
```js
server: isH5 ? "server" : "https://8.148.69.248/"
```

H5 端 serverRequest 直接使用 `/server` 作为 baseURL；WeApp 端由云函数内部拼接完整 URL。

---

## 4. 设置页交互流程 (`src/modules/pages/settings/index.jsx`)

新增 loading 状态变量 `expandLoading`，参考已有的 `darkLoading` 和 `forceLoading` 模式：
- 在 toggle 行右侧显示 `<AtActivityIndicator>` 当 `expandLoading` 为 true
- `ToggleSwitch` 在 loading 时 disabled

修改 `updateFeature` 回调中 `expand` 分支的逻辑：

```
用户点击拓展开关（targetState = true）：

1. 立即设置 expandLoading=true，开关显示 loading
2. 前置校验：若 stuId 或 password 为空，Toast "请先登录教务系统"，回退
3. 调用 serverGet("/api/v1/auth/check-user", {
     stuId: userManager.stuId,
     schoolId: userManager.schoolId || "hbut"
   })
3. 根据响应判断：
   a. exists === true → 直接 updateFeature("expand", true)，开关打开
   b. exists === false → 弹出 Taro.showModal：
      - title: "用户注册"
      - content: "使用拓展功能需要将你的个人信息上传到服务器，是否同意？"
      - confirmText: "同意"
      - cancelText: "取消"
      - 取消/关闭 → 开关回退（保持关闭），loading 结束
      - 同意 → 调用 POST /api/v1/auth/register：
        body: {
          stuId: userManager.stuId,
          password: userManager.password,
          schoolId: userManager.schoolId || "hbut",
          nickName: userManager.realName
        }
        - 成功 → 存储返回的 token，updateFeature("expand", true)
        - 失败 → showToast 错误信息，开关保持关闭
4. 清除 loading 状态

用户点击关闭（targetState = false）：
- 直接 updateFeature("expand", false)，无网络请求
```

### 前置校验

| 场景 | 处理 |
|------|------|
| stuId 或 password 为空 | Toast "请先登录教务系统"，开关回退，不发起网络请求 |

### 服务器交互错误处理

| 场景 | 处理 |
|------|------|
| 网络超时/异常 | Toast "网络连接失败，请稍后重试"，开关回退 |
| 接口返回 4xx/5xx | 显示服务端返回的 message，开关回退 |
| check-user 返回 exists=true | 直接打开开关（token 非必须，仅用于后续认证接口） |
| 注册返回"该学号在此学校已注册" | 视为已注册，直接打开开关 |
| 教务系统验证失败 | 显示"学号或密码错误"，开关回退 |

### 关闭行为

关闭"拓展"开关时：无网络请求，仅更新本地状态。serverToken 保留不删除。

---

## 5. 后端

后端接口已完整实现，**无需改动**：

- `GET /api/v1/auth/check-user` → `handlers.CheckUser()` — 查询参数 `stuId`, `schoolId`，返回 `{exists: true/false}`
- `POST /api/v1/auth/register` → `handlers.StudentRegister()` — body `{stuId, password, schoolId, nickName}`，返回 `{token, user}`

CORS 中间件已配置，无需额外处理。

---

## 6. 文件变更清单

| File | Action | Description |
|------|--------|-------------|
| `src/service/userInfo.js` | Modify | Add `schoolId`, `serverToken` fields + getter/setter |
| `src/config/api.js` | Verify | Already has `server` entry — no change needed |
| `src/utils/serverRequest.h5.js` | Create | Axios instance with proxy baseURL and auth interceptor |
| `src/utils/serverRequest.weapp.js` | Create | Cloud function wrapper with same interface |
| `src/modules/pages/settings/index.jsx` | Modify | Replace expand toggle handler with check/register flow |
| WeChat cloud function `serverProxy` | Deploy | Manual deploy — forward HTTP requests to server |
| `config/index.js` | Verify | `/server` proxy already exists — no change needed |
| `main.go` | No change | Backend `/api/v1` routes already exist |

---

## 7. What's NOT Covered (out of scope)

- WeChat cloud function deployment — this is a manual operation requiring WeChat cloud console access
- Production H5 reverse proxy setup — each deployment environment handles this differently
- Using the stored JWT token for authenticated API calls — this is infrastructure for future features
- Adding `schoolId` to the login flow — currently hardcoded to "hbut" via `userManager.schoolId || "hbut"` fallback
