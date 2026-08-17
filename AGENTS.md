# AGENTS.md — taro_mini 项目说明书

> 本文档面向 AI 代理与贡献者，用于在 5 分钟内理解项目结构、技术栈、运行方式与核心约定。内容基于实际代码梳理，路径与命令均已核对。

## 目录

- [1. 项目简介](#1-项目简介)
- [2. 技术栈](#2-技术栈)
- [3. 快速开始](#3-快速开始)
- [4. 目录结构](#4-目录结构)
- [5. 架构与数据流](#5-架构与数据流)
- [6. 平台适配机制](#6-平台适配机制)
- [7. 核心业务逻辑](#7-核心业务逻辑)
- [8. 环境变量](#8-环境变量)
- [9. 开发约定](#9-开发约定)
- [10. 常见任务](#10-常见任务)
- [11. 构建、CI 与部署](#11-构建ci-与部署)
- [12. 注意事项与待补充](#12-注意事项与待补充)

---

## 1. 项目简介

`taro_mini` 是一款面向 **湖北工业大学** 学生的跨端应用（微信小程序 + H5），基于 **Taro 4.2 + React 18 + Vite + Sass** 构建。

核心功能：通过模拟登录湖工大教务系统（`jwxt.hbut.edu.cn`），聚合展示 **课程表、成绩、考试安排、空教室、培养方案、学生信息** 等教务数据，并附带校园生活类功能（社团、二手书、天气、食堂/地图指南、木鱼解压等）。

- 主仓库（Gitee）：https://gitee.com/damn_2/taro_mini
- 主仓库（GitHub）：https://github.com/Spinach5/taro_mini
- License：MIT

---

## 2. 技术栈

| 类别 | 技术 |
|------|------|
| 跨端框架 | Taro `4.2.0`（Vite 编译器） |
| UI 框架 | React `18` |
| 状态管理 | Zustand `5`（`persist` 中间件持久化到 Taro Storage） |
| 样式 | Sass / CSS（`taro-ui` + `taro-icons` 图标库） |
| HTTP | H5 用 `axios` + `taro-axios-adapter`；小程序用 `Taro.request` |
| 加密 | `crypto-js`（AES/MD5）、`jsencrypt` / `wx-jsencrypt`（RSA） |
| 云能力 | 腾讯云开发 CloudBase（`@cloudbase/js-sdk`、`Taro.cloud`） |
| 代码质量 | ESLint（`eslint-config-taro`）、Stylelint（`stylelint-config-standard`）、commitlint + husky |
| 包管理 | 推荐 pnpm（仓库同时存在 npm / yarn / pnpm 锁文件） |

> 说明：无 TypeScript，全部为 `.js/.jsx`。无单元测试套件。

---

## 3. 快速开始

```bash
# 安装依赖（README 推荐 pnpm；CI 使用 npm --legacy-peer-deps）
pnpm install
# 若依赖冲突：
npm install --legacy-peer-deps

# 开发（H5，端口 10086，支持 HMR）
npm run dev:h5      # 或 pnpm dev:h5

# 开发（微信小程序，支持 HMR）
npm run dev:weapp   # 或 pnpm dev:weapp

# 生产构建
npm run build:h5
npm run build:weapp
```

- 构建产物输出到 `dist/<platform>/`（如 `dist/h5`、`dist/weapp`）。
- 微信小程序：用「微信开发者工具」打开项目根目录（`miniprogramRoot` 指向 `dist/weapp/`），需在项目设置中 **关闭**「ES6 转 ES5」「上传时样式自动补全」「代码压缩上传」。
- 其它平台脚本见 `package.json`：`dev/build:swan`、`alipay`、`tt`、`qq`、`jd`、`harmony-hybrid`、`rn`。

---

## 4. 目录结构

```
taro_mini/
├── config/                      # Taro 构建配置（dev/prod + 入口 index.js）
├── mocks/                       # React Native 相关 mock（RN 端使用，H5/小程序无关）
├── .github/workflows/           # CI（多端构建发布）
├── .husky/                      # commit-msg 钩子（commitlint）
└── src/
    ├── app.js                   # H5 应用入口
    ├── app.weapp.js             # 微信小程序应用入口（Taro.cloud.init + ThemeProvider）
    ├── app.config.js            # 页面路由、分包、自定义 tabBar、权限声明
    ├── app.css / design-system.css
    ├── index.html               # H5 入口 HTML
    ├── pages/                   # 主包页面（3 个 Tab）
    │   ├── index/               # 首页（天气、轮播、功能入口）
    │   ├── course/              # 课程表
    │   └── user/                # 个人中心
    ├── modules/                 # 分包（subPackages，懒加载）
    │   ├── data/staticPages.js  # 静态展示数据（学生会/食堂/地图/二手书示例）
    │   └── pages/               # 22+ 个分包页面，见下方列表
    ├── components/
    │   ├── base/                # Loading、SafeAreaView（页面外壳 + 自定义 TabBar）
    │   ├── business/            # 通用业务组件（分类、弹窗、搜索、状态页等）
    │   ├── feature/             # 功能组件（课程网格、学期/周次选择、木鱼等）
    │   └── layout/              # 布局（TabBar、HeadStatus、GridContainer/Item）
    ├── config/
    │   └── api.js               # 唯一环境变量读取点 + API_BASE 平台切换
    ├── hooks/                   # 自定义 hooks（useRequest/useList/useDebounce/useAuthGuard/usePullRefresh）
    ├── service/                 # 业务服务层（数据获取 + 状态编排）
    │   ├── schools/hbut/        # 湖工大教务 API 封装（见第 5 节）
    │   ├── index.js             # 统一出口，按学校路由到对应实现
    │   ├── router.js            # 学校 → 实现模块映射（SCHOOL_MAP）
    │   ├── login.js             # 登录编排
    │   ├── autoLogin.js         # 启动时自动登录
    │   ├── userInfo.js          # UserManager 单例（兼容层，委托 zustand）
    │   ├── weatherInfo.js       # 天气单例
    │   └── ...                  # AddSchedule / sendFeedback / muyuAudio 等
    ├── store/                   # Zustand store（useUserStore/useThemeStore/useWeatherStore/useSettingsStore）
    └── utils/
        ├── common/              # cache / cookies / runtimeLogger / rex / checkStuID 等
        ├── business/hbut/       # 教务业务 helper（课程/成绩/周次/时间/登录加密等）
        ├── platform/            # 平台差异化实现（request / serverRequest / getLocation / cloudbase）
        └── react/theme.jsx      # 主题 Provider
```

### 分包页面（`src/modules/pages/`）

`app.config.js` 中 `subPackages` 的基础页面（始终打包）：

`login`、`club`（含 `detail`/`add`）、`muyu`、`affair`、`student`、`food`、`exam`、`empty_room`、`book`（含 `detail`）、`runtimeLog`、`material`、`repo`、`settings`、`join`、`feedback`、`weather`、`webview`、`plan`、`notification`

由环境变量 `TARO_APP_ENABLE_BOOK_TRADE === "true"` 才额外打包：

`book/edit`、`book/buy`、`chat/list`、`chat/detail`

---

## 5. 架构与数据流

### 5.1 分层

```
页面 (pages/modules)  →  service (index.js / userInfo / weatherInfo)
                              │  按学校路由
                              ▼
                    service/schools/hbut/* (教务 API 封装)
                              │
                              ▼
                utils/platform/request.*  (hbutRequest / serverRequest)
                              │
                              ▼
                     后端：教务系统 / 自建 Go 后端 / 第三方服务
```

- 页面一般只调用 `src/service` 导出的函数，不直接依赖具体学校实现。
- `service/index.js` 通过 `router.js` 的 `getSchool()` 按 `userManager.getUniversity()` 路由到 `schools/hbut`（目前仅支持湖工大）。

### 5.2 请求层（`utils/platform/`）

三套请求实例，均由 `config/api.js` 的 `API_BASE` 决定 baseURL：

| 实例 | 用途 | Cookie 前缀 |
|------|------|-------------|
| `hbutRequest` | 湖工大教务系统 | `cookies_hbut` |
| `giteeRequest` | Gitee API（贡献者/仓库信息） | `cookies_gitee` |
| `serverRequest` | 自建 Go 后端（JWT，`Authorization: Bearer`） | —（无 Cookie） |

`request.h5.js` / `request.weapp.js` 均导出 `hbutRequest`、`giteeRequest` 及 `*Cookies`（`CookiesManager` 实例）。两者都做「自动注入 Cookie + 自动捕获 Set-Cookie」；H5 因浏览器限制，实际依赖 Vite 代理剥离 `Set-Cookie` 的 `Domain/Secure` 后由浏览器自动管理，小程序则在 `requestCore` 里手动解析并跟随重定向（最多 10 跳）。

### 5.3 状态管理（`store/`）

- `useUserStore`：用户身份核心状态（`university`、`realName`、`stuId`、`grade`、`majority`、`class`、`college`、`schoolId`、`isLoggedIn`、`serverToken`、`encryptedPassword` 等），用 `zustand/persist` 持久化到 Taro Storage（key `user-store`）。
- `src/service/userInfo.js` 的 `UserManager` 是**向后兼容层**：状态实际委托给 `useUserStore`，旧代码仍可 `userManager.setField(...)` / `userManager.stuId` 访问。明文密码仅存内存，不持久化。
- `useThemeStore` / `useWeatherStore` / `useSettingsStore` 分别管理主题、天气、设置。

### 5.4 缓存与 Cookie

- `utils/common/cache.js`：`CacheManager` 单例，封装 `Taro.Storage`，支持 TTL。
- `utils/common/cookies.js`：`CookiesManager`，按前缀区分后端，缓存 key 形如 `cookies_hbut`。

---

## 6. 平台适配机制

Taro 通过**文件名后缀**解析平台差异文件：导入时写 `./request`（不带后缀），构建时按当前 `TARO_ENV` 自动命中 `request.weapp.js` 或 `request.h5.js`。

平台差异化文件（`src/utils/platform/` 与 `src/utils/business/hbut/`）：

| 导入名 | 实际文件 |
|--------|----------|
| `./request` | `request.h5.js` / `request.weapp.js` |
| `./serverRequest` | `serverRequest.h5.js` / `serverRequest.weapp.js` |
| `./getLocation` | `getLocation.h5.js` / `getLocation.weapp.js` |
| `./cloudbase` | `cloudbase.h5.js` / `cloudbase.js` |
| `loginEncrypt` | `loginEncrypt.h5.js` / `loginEncrypt.weapp.js` |

判断平台用 `process.env.TARO_ENV`（值为 `h5` / `weapp` 等）。构建时注入，属于框架常量。

H5 端开发依赖 `config/index.js` 中的 Vite `devServer.proxy` 代理避免 CORS，主要代理映射：

| 前缀 | 目标 |
|------|------|
| `/hbut` | `https://jwxt.hbut.edu.cn`（教务系统） |
| `/hbut_www` | `https://www.hbut.edu.cn`（学校官网） |
| `/server` | `http://localhost:3001`（自建 Go 后端） |
| `/gitee` | `https://gitee.com` |
| `/captcha` | `https://captcha.chaoxing.com/captcha`（超星验证码） |
| `/open_meteo` / `/ipapi` / `/bigdata` / `/isbn` | 天气 / IP 定位 / 大数据 / ISBN 查询 |

---

## 7. 核心业务逻辑

### 7.1 登录流程（`service/login.js` + `schools/hbut/auth.js`）

1. 校验学校与学号格式（`SUPPORTED_UNIVERSITIES` 仅湖工大）。
2. 临时写入 `userManager`（学号/密码/学校）。
3. `school.auth()`：
   - 密码用 RSA 公钥加密（`loginEncrypt`）。
   - **先解超星滑块验证码**：拉取验证码配置 → 生成 token/iv → 请求滑块图 → 调自建后端 `/api/captcha/solve` 计算缺口距离 → 提交验证，拿到 `validate`。
   - GET `/admin/login` 拿初始 Cookie → POST 登录（`rememberMe=1`）。
   - 以响应中是否出现 `puid` + `username` 的认证 Cookie 判断登录成功。
4. 成功后 `school.getStuInfo()` 拉取个人信息并写入 `userManager`。

### 7.2 自动登录（`service/autoLogin.js`）

- 凭证存 `autoLoginCreds`（AES 加密后的密码），`app.weapp.js` 的 `useLaunch` 中调用 `checkAndAutoLogin()`。
- 流程：先 `getStuInfo({ forceRefresh: true })` 校验 Cookie 是否有效；失效则解密密码重新 `auth()` + `getStuInfo()`。

### 7.3 教务数据获取示例（`schools/hbut/StuInfo.js`）

典型数据流：先 `getXhid()` 取 `xhid` → 请求 `/admin/xsd/xskp/xskp?xhid=...` → `AutoRetry` 重试 → 校验 `ret` 业务码 → 映射字段（如 `xm→realName`、`xh→stuId`）→ 写入 `CacheManager`。

### 7.4 运行时日志

`utils/common/runtimeLogger.js` 记录日志到 Taro Storage（上限 500 条），可在小程序内 `/modules/pages/runtimeLog/index` 查看，用于排查登录/请求问题。

---

## 8. 环境变量

> `config/index.js` 手动加载 `.env` / `.env.development` / `.env.production`（Taro 不自动加载）。**所有 `process.env` 读取集中在 `src/config/api.js`，其它模块一律 import 该文件的常量，禁止直接读 `process.env`**（`TARO_ENV` / `NODE_ENV` 框架常量除外）。

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `TARO_APP_SERVER_BASE` | `https://spinach.cc.cd` | 自建 Go 后端地址 |
| `TARO_APP_HBUT_ORIGIN` | `https://jwxt.hbut.edu.cn` | 教务系统域名（Referer/Origin 头） |
| `TARO_APP_HBUT_WWW` | `https://www.hbut.edu.cn` | 学校官网 |
| `TARO_APP_GITEE_BASE` | `https://gitee.com/` | Gitee API |
| `TARO_APP_CAPTCHA_BASE` | `https://captcha.chaoxing.com/captcha` | 超星验证码 |
| `TARO_APP_OPEN_METEO_BASE` | `https://api.open-meteo.com/` | 天气 |
| `TARO_APP_IPAPI_BASE` / `TARO_APP_BIGDATA_BASE` | `https://ipapi.co/` / `https://api.bigdatacloud.net` | IP 定位 |
| `TARO_APP_ISBN_BASE` | `https://data.isbn.work` | ISBN 查询 |
| `TARO_APP_CONTACT_EMAIL` / `TARO_APP_CONTACT_AVATAR` | 见 `api.js` | 「关于」页联系方式 |
| `TARO_APP_ENABLE_BOOK_TRADE` | `"false"` | 二手书交易/聊天分包开关（仅 `=== "true"` 开启） |
| `TARO_APP_ID` | `wx34ee413298fbcb9f` | 微信小程序 AppID |
| `TARO_WEAPP_CLOUD` | `cloudbase-d0gl91v7x5514ed03` | 微信云开发环境 |
| `VITE_CLOUDBASE_ENV_ID` | `cloudbase-d0gl91v7x5514ed03` | CloudBase 环境 ID |
| `VITE_CLOUDBASE_ACCESS_KEY` | 空 | CloudBase 匿名访问令牌（**敏感**） |
| `TARO_APP_GITEE` | 空 | Gitee 访问 token（**敏感**） |
| `ISBN_KEY` | 空 | ISBN 查询 appKey（**敏感**） |

> ⚠️ 仓库中的 `.env.test` 含有真实密钥（Gitee token、CloudBase access key、ISBN key），请勿直接复制到生产或公开；敏感值在文档中以占位符表示。

---

## 9. 开发约定

- **包管理器**：README 推荐 `pnpm`；CI（`.github/workflows/build.yaml`）用 `npm install --legacy-peer-deps`；`CONTRIBUTING.md` 写的是 `yarn`。三套锁文件并存，属待统一项。
- **Node 版本**：CI 用 Node 22；`CONTRIBUTING.md` 建议 v16+。
- **缩进**：`.editorconfig` 配置为 **tab**、宽度 4（Markdown 不去尾空格）。代码风格整体与 `eslint-config-taro` 一致。
- **Lint/格式**：`package.json` 未定义 `lint`/`format` 脚本，需手动执行：`npx eslint src`、`npx stylelint "src/**/*.{css,scss}"`。
- **提交规范**：Conventional Commits（`@commitlint/config-conventional` + husky `commit-msg` 钩子），格式 `type: 描述`（如 `feat`/`fix`/`docs`/`refactor`）。
- **分支规范**（`CONTRIBUTING.md`）：`master` 生产、`dev` 开发；功能分支命名 `feat/xxx`、`fix/xxx` 等，PR 目标分支为 `dev`。
- **注释语言**：中文。

---

## 10. 常见任务

**新增一个分包页面**
1. 在 `src/modules/pages/<name>/` 创建 `index.jsx` + `index.config.js`（+ 样式）。
2. 在 `src/app.config.js` 的 `subPackages[0].pages` 数组中加入 `pages/<name>/index`。
3. 若页面需要登录，使用 `useAuthGuard`（默认跳转 `/modules/pages/login/index`）。

**新增一个教务 API**
1. 在 `src/service/schools/hbut/` 新增模块（用 `hbutRequest`，注意 `Referer/Origin` 头与 `AutoRetry`）。
2. 在 `src/service/schools/hbut/index.js` 导出。
3. 在 `src/service/index.js` 通过 `api('xxx')` 统一暴露。

**接入新的第三方服务域名**
- 在 `src/config/api.js` 增加常量并加入 `API_BASE`（H5 用代理路径、小程序用完整域名）。
- 在 `config/index.js` 的 `h5.devServer.proxy` 增加对应代理。

**调试**
- 首选查看应用内运行时日志页（`runtimeLog`）；请求相关日志由 `runtimeLogger` 落库。
- H5 端调试后端接口需先启动自建 Go 后端（`go run ./cmd/server`，监听 3001），否则 `/server` 代理返回 502。

---

## 11. 构建、CI 与部署

- 本地构建：`npm run build:<platform>`（产出 `dist/<platform>/`）。
- CI（`.github/workflows/build.yaml`）：推送 `v*` tag 或手动触发时，matrix 构建 `h5`、`weapp`，压缩 `dist/<platform>` 为 zip 上传 artifact，并在 GitHub 发布 Release。
- 微信小程序发布：微信开发者工具导入 `dist/weapp/`，上传代码（需关闭 ES6 转 ES5、样式自动补全、代码压缩）。

---

## 12. 注意事项与待补充

- **自建后端不在本仓库**：`/server` 代理指向独立 Go 服务（`http://localhost:3001`，`go run ./cmd/server`），用于验证码求解、注册、二手书等拓展功能。
- **遗留项**：`request.h5.js` / `request.weapp.js` 仍导出 `opendiffRequest` / `opendiffCookies`，但 `config/api.js` 已无 `opendiff` 配置（baseURL 为 undefined），属历史遗留，可考虑清理。
- **敏感信息**：`.env.test` 含真实密钥，建议改用 `.env.example` + 占位符并加入 `.gitignore`（当前 `.gitignore` 仅忽略 `.env.production` / `.env.development`，未忽略 `.env` / `.env.test`）。
- **无测试**：无单元测试/端到端测试；无 `lint` npm 脚本，需手动调用 eslint/stylelint。
- **文档差异**：`CLAUDE.md` 中部分路径已过时（如 `src/service/hbut/` 实为 `src/service/schools/hbut/`；`src/utils/request.h5.js` 实为 `src/utils/platform/request.h5.js`；分包页面数量已远超 10 个）。
