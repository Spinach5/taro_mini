# 源码目录说明

## 目录结构

```
src/
├── app.js / app.config.js    # 应用入口与路由
├── assets/                   # 静态资源（图标、音频）
├── components/               # 可复用 UI 组件（PascalCase 命名）
├── config/                   # 环境配置
├── modules/
│   ├── data/                 # 分包页面静态数据
│   └── pages/                # 分包页面（非 tabBar）
├── pages/                    # 主包页面（tabBar：首页 / 课程 / 我的）
├── service/
│   ├── hbut/                 # 湖工大教务 API
│   ├── clubs.js              # 开放接口（社团等）
│   └── login.js              # 登录流程
└── utils/                    # 工具与请求封装
```

## 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| React 组件文件 | PascalCase | `SafeAreaView.jsx`, `GridContainer.jsx` |
| 组件默认导出 | 与文件名一致 | `export default function SafeAreaView` |
| 页面目录 | 小写 | `pages/muyu/index.jsx` |
| 服务模块 | camelCase | `muyuAudio.js`, `userInfo.js` |
| 教务 API | `service/hbut/` | `getSemesterList`, `getStuInfo` |

## 运行日志

- 工具类：`utils/runtimeLogger.js`（`info` / `warn` / `error`，持久化到缓存）
- 查看页面：分包 `modules/pages/runtimeLog/index`

## 引用路径

- 主包页面引用组件：`../../components/Xxx`
- 分包页面引用组件：`../../../components/Xxx`
- 教务 API 推荐：`../../service/hbut/模块名` 或 `../../service/hbut`（barrel）
