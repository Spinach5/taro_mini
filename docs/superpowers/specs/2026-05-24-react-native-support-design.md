# React Native Platform Support Design

**Date:** 2026-05-24  
**Scope:** Add React Native (RN) as a third platform alongside WeChat mini program and H5, then build an APK via local Android Studio.

## Overview

Extend the existing Taro 4.2.0 project to support React Native. The approach follows the existing platform-specific file pattern (`*.h5.js` / `*.weapp.js` → `*.rn.js`) and keeps the custom `TabBar` + `SafeAreaView` navigation consistent across all platforms.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Navigation | Keep custom `TabBar` + `SafeAreaView` | Consistent UI across all 3 platforms |
| Compiler for RN | Webpack5 (Vite for H5/WeChat) | Better RN compatibility, battle-tested |
| APK build | Local Android Studio | Full control, no CI dependency |
| Encryption lib for RN | `jsencrypt` (same as H5) | Already a dependency, works in RN's JS runtime |
| App name | `taro_mini` | User-specified Android home screen name |

## 1. Request Layer — `src/utils/request.rn.js`

New file following the `request.weapp.js` pattern, but using RN's native `fetch` API instead of `Taro.request`.

**Structure:**
- `createRequest(baseURL, cookieManager)` factory — same signature as H5 and WeChat implementations
- Manual redirect handling (up to 5 hops), same logic as weapp
- Cookie injection via `Cookie` request header
- Cookie capture from `Set-Cookie` response header
- Form-urlencoded body serialization for object data
- Exports: `hbutRequest`, `opendiffRequest`, `giteeRequest` + their cookie managers (`hbutCookies`, `opendiffCookies`, `giteeCookies`)

**Reused modules (no changes needed):**
- `src/utils/cookies.js` — `CookiesManager` is platform-agnostic (uses `Taro.Storage` which maps to `AsyncStorage` on RN)
- `src/utils/runtimeLogger.js` — uses `Taro.getStorageSync`/`setStorageSync`, works on RN

## 2. Login Encryption — `src/utils/hbut/loginEncrypt.rn.js`

New file following the `loginEncrypt.h5.js` pattern:
- Use `jsencrypt` library (already in `package.json`)
- Same RSA public key and `encryptPassword` function signature as H5
- Taro's platform file resolution automatically selects `*.rn.js` when `TARO_ENV === 'rn'`

## 3. Build Configuration — `config/index.js`

Changes to the existing config:

```js
const isRn = process.env.TARO_ENV === 'rn';

// In baseConfig:
compiler: isRn ? 'webpack5' : 'vite',
```

Update the existing `rn` block:
```js
rn: {
    appName: 'taro_mini',  // changed from 'taroDemo'
    postcss: { cssModules: { enable: false } },
},
```

## 4. Dependencies — `package.json`

New dependencies to install:
- `@tarojs/plugin-platform-rn` — Taro's RN platform plugin
- `react-native` — RN core runtime
- `@react-native-async-storage/async-storage` — backing store for `Taro.Storage` on RN

Existing scripts `build:rn` and `dev:rn` are already present and require no changes.

## 5. Android Shell & APK Build

### Build flow:
1. Run `taro build --type rn` → generates RN bundle + `android/` shell project
2. Open `android/` in Android Studio
3. `Build → Build APK(s)` → APK output at `android/app/build/outputs/apk/`

### One-time Android Studio prerequisites:
- Android SDK (API level 31+)
- `ANDROID_HOME` environment variable set
- SDK licenses accepted via `sdkmanager --licenses`
