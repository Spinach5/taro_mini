# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development

```bash
npm run dev:h5          # H5 web dev with HMR (port 10086)
npm run dev:weapp       # WeChat mini program dev with HMR
npm run build:weapp     # Production WeChat build
npm run build:h5        # Production H5 build
npm run dev:zx          # alias for H5 dev
```

No test suite is configured. Linting: ESLint (`eslint-config-taro`), Stylelint (`stylelint-config-standard`). Commit messages follow conventional commits (commitlint + husky).

## Architecture

**Taro 4.2 cross-platform app** (WeChat mini program + H5) — React 18, Vite compiler, SASS styles. Student-facing app for 湖北工业大学教务系统.

### Page structure

- **3 main tab pages** (`src/pages/`): `index` (home/dashboard), `course` (schedule grid), `user` (profile)
- **10 subpackage pages** (`src/modules/pages/`): login, club, muyu, affair, student, food, daily, map, book, runtimeLog — lazy-loaded via WeChat subpackages (`app.config.js:34-50`)
- Custom `TabBar` rendered inside `SafeAreaView` — the native tab bar is hidden (`navigationStyle: "custom"`), and `SafeAreaView` handles safe-area insets + tab bar padding

### Platform adaptation

Two request implementations selected by `TARO_ENV`:

- **H5** (`src/utils/request.h5.js`): axios + `taro-axios-adapter`, uses Vite dev server proxy (`/hbut` → `jwxt.hbut.edu.cn`, `/opendiff` → `api.zxionf.top`) to avoid CORS
- **WeChat** (`src/utils/request.weapp.js`): `Taro.request` with manual redirect handling (up to 5 hops), form-urlencoded body serialization

Both export `hbutRequest` and `opendiffRequest` with automatic Set-Cookie capture and Cookie header injection via `CookiesManager`. Login encryption also has platform-specific implementations (`loginEncrypt.h5.js` / `loginEncrypt.weapp.js`).

### Data layer

- `src/service/hbut/` —教务系统 API wrappers: auth, schedule, scores, exams, student info, semester/week helpers. All re-exported through `index.js`.
- `src/utils/cache.js` — `CacheManager` singleton wrapping `Taro.Storage` with optional TTL
- `src/utils/cookies.js` — `CookiesManager` class (prefix-namespaced, e.g. `cookies_hbut`) that persists cookies to storage and serializes to request headers
- `src/service/userInfo.js` — `UserManager` singleton: in-memory + cached user state (`stuId`, `password`, `realName`, `college`, etc.), login/logout, field-level setters
- `src/utils/runtimeLogger.js` — In-app logger persisted to `Taro.Storage` (max 500 entries), viewable at `/modules/pages/runtimeLog/index`

### Key components

`SafeAreaView` wraps every page: applies safe-area padding, renders custom `TabBar`, gradient background. It receives `currentPath` from `useRouter()` to highlight the active tab.

### API config

`src/config/api.js` — switches base URLs by platform: H5 uses proxy paths (`/hbut`, `/opendiff`), mini program uses full origin URLs.
