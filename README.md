# taro_mini
[![Latest Tag](https://img.shields.io/github/v/tag/Spinach5/taro_mini?label=latest)](https://github.com/Spinach5/taro_mini/tags)
![GitHub Release Date](https://img.shields.io/github/release-date/Spinach5/taro_mini)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Gitee stars](https://gitee.com/damn_2/taro_mini/badge/star.svg?theme=dark)](https://gitee.com/damn_2/taro_mini)
[![GitHub stars](https://img.shields.io/github/stars/Spinach5/taro_mini?style=social)](https://github.com/Spinach5/taro_mini)
<p align="center">
<img src="https://foruda.gitee.com/avatar/1777480666913616794/16193480_damn_2_1777480666.png" width="200">
</p>
本项目采用Vite+React+Sass构建，基于Taro框架

[gitee仓库](https://gitee.com/damn_2/taro_mini)
[github仓库](https://github.com/Spinach5/taro_mini)

## 部署教程
```sh
#克隆项目
git clone https://gitee.com/damn_2/taro_mini.git

cd taro_mini/

#下载依赖
npm install
#如果报错，显示依赖冲突，使用
npm install --legacy-peer-deps
```
## 包管理器
本项目推荐使用 **pnpm** 作为包管理器。

> 💡 项目根目录已包含 `pnpm-lock.yaml` 和 `pnpm-workspace.yaml` 配置文件。

### 安装 pnpm
```sh
# 使用 npm 全局安装 pnpm
npm install -g pnpm

# 或者使用 corepack 启用 pnpm（Node.js 16.13+ / 18+）
corepack enable
```

### 使用 pnpm 安装依赖
```sh
# 克隆项目
git clone https://gitee.com/damn_2/taro_mini.git
cd taro_mini/

# 使用 pnpm 安装依赖
pnpm install
```

## 构建
- dev 模式（增加 --watch 参数） 将会监听文件修改。
- build 模式（去掉 --watch 参数） 将不会监听文件修改，并会对代码进行压缩打包。
开发环境(dev)
```sh
#网页端,支持热重载，修改代码，网页自动更新
npm run dev:h5

#微信小程序，支持热重载
npm run dev:weapp
```
生产环境(build)
```sh
# pnpm
$ pnpm dev:weapp
$ pnpm build:weapp

# yarn
$ yarn dev:weapp
$ yarn build:weapp

# npm script
$ npm run dev:weapp
$ npm run build:weapp
$ taro build --type weapp --watch
$ taro build --type weapp

$ npx taro build --type weapp --watch
$ npx taro build --type weapp

# watch 同时开启压缩
#cmd
NODE_ENV=production && taro build --type weapp --watch 

#bash
NODE_ENV=production taro build --type weapp --watch # Bash
```
### 使用 pnpm 构建
项目推荐使用 pnpm 进行构建，所有 npm scripts 同样适用于 pnpm：

开发环境(dev)
```sh
# 网页端，支持热重载
pnpm dev:h5

# 微信小程序，支持热重载
pnpm dev:weapp
```

生产环境(build)
```sh
# 网页端生产构建
pnpm build:h5

# 微信小程序生产构建
pnpm build:weapp
```

其他平台构建
```sh
# 百度小程序
pnpm dev:swan / pnpm build:swan

# 支付宝小程序
pnpm dev:alipay / pnpm build:alipay

# 字节跳动小程序
pnpm dev:tt / pnpm build:tt

# QQ 小程序
pnpm dev:qq / pnpm build:qq

# 京东小程序
pnpm dev:jd / pnpm build:jd

# 鸿蒙混合应用
pnpm dev:harmony-hybrid / pnpm build:harmony-hybrid
```

### 小程序开发者工具
下载并打开微信开发者工具，然后选择项目根目录进行预览。

需要注意开发者工具的项目设置：

- 需要设置关闭 ES6 转 ES5 功能，开启可能报错
- 需要设置关闭上传代码时样式自动补全，开启可能报错
- 需要设置关闭代码压缩上传，开启可能报错

## 目录结构
```
taro_mini/
├── config/                         # 构建配置
│   ├── dev.js                      # 开发环境配置
│   ├── index.js                    # 配置入口
│   └── prod.js                     # 生产环境配置
├── mocks/                          # React Native Mock 文件
│   ├── @bam.tech/
│   ├── @react-native-camera-roll/
│   ├── @react-native-community/
│   ├── expo/
│   ├── expo-av/
│   └── expo-barcode-scanner/
├── src/
│   ├── assets/                     # 静态资源
│   │   ├── audio/                  # 音频文件
│   │   ├── MuyuIcon.jsx            # 木鱼图标组件
│   │   ├── muyu-stick.svg          # 木鱼槌图标
│   │   ├── muyu.svg                # 木鱼图标
│   │   └── tower.jpeg             # 塔楼图片
│   ├── components/                 # 公共组件
│   │   ├── base/                   # 基础组件
│   │   │   ├── Loading.jsx         # 加载组件
│   │   │   └── SafeAreaView.jsx   # 安全区域视图组件
│   │   ├── business/               # 业务组件
│   │   │   ├── CategoryTabs/       # 分类标签页
│   │   │   ├── DetailModal/        # 详情弹窗
│   │   │   ├── FAB/                # 悬浮按钮
│   │   │   ├── PageHeader/         # 页面头部
│   │   │   ├── SearchBar/          # 搜索栏
│   │   │   └── StatusView/         # 状态视图
│   │   ├── feature/                # 功能组件
│   │   │   ├── AddCourseModal.*    # 添加课程弹窗
│   │   │   ├── Btn.*               # 按钮组件
│   │   │   ├── CategoryFilter.*    # 分类筛选
│   │   │   ├── CourseGrid.*        # 课程网格
│   │   │   ├── CourseHeader.*      # 课程头部
│   │   │   ├── IndexSwiper.*       # 首页轮播
│   │   │   ├── InputBar.*          # 输入栏
│   │   │   ├── MuYu.*              # 木鱼组件
│   │   │   ├── PracticeCard.*      # 练习卡片
│   │   │   ├── SelectAudioModal.*  # 选择音频弹窗
│   │   │   ├── SemesterSelector.*  # 学期选择器
│   │   │   ├── StaticListPage.*    # 静态列表页
│   │   │   ├── TimeColumn.*        # 时间列
│   │   │   ├── TimeSlot.*          # 时间段
│   │   │   ├── UserCard.*          # 用户卡片
│   │   │   ├── WeekHeader.*        # 周次头部
│   │   │   └── WeekSelectorModal.* # 周次选择弹窗
│   │   └── layout/                 # 布局组件
│   │       ├── GridContainer.jsx   # 网格容器
│   │       ├── GridItem.*          # 网格项
│   │       ├── HeadStatus.*        # 头部状态
│   │       └── TabBar.*            # 标签栏
│   ├── config/                     # 应用配置
│   │   └── api.js                  # API 地址配置
│   ├── hooks/                      # 自定义 Hooks
│   │   ├── index.js                # Hooks 导出
│   │   ├── useAuthGuard.js         # 认证守卫
│   │   ├── useDebounce.js          # 防抖 Hook
│   │   ├── useList.js              # 列表数据 Hook
│   │   ├── usePullRefresh.js       # 下拉刷新 Hook
│   │   └── useRequest.js           # 请求 Hook
│   ├── modules/                    # 模块（分包）
│   │   ├── data/
│   │   │   └── staticPages.js      # 静态页面数据
│   │   └── pages/                  # 分包页面
│   │       ├── affair/             # 事务页
│   │       ├── book/               # 二手书（buy/detail/edit）
│   │       ├── chat/               # 聊天室（detail/list）
│   │       ├── club/               # 社团（add/detail）
│   │       ├── empty_room/         # 空教室
│   │       ├── exam/               # 考试安排
│   │       ├── feedback/           # 反馈
│   │       ├── food/               # 食堂
│   │       ├── join/               # 加入页
│   │       ├── login/              # 登录
│   │       ├── material/           # 资料
│   │       ├── muyu/               # 木鱼
│   │       ├── plan/               # 学习计划
│   │       ├── repo/               # 仓库
│   │       ├── runtimeLog/        # 运行日志
│   │       ├── settings/           # 设置
│   │       ├── student/            # 学生信息
│   │       ├── weather/            # 天气
│   │       └── webview/            # 网页视图
│   ├── pages/                      # 主包页面（TabBar 页面）
│   │   ├── index/                  # 首页/仪表盘
│   │   ├── course/                 # 课程表
│   │   └── user/                   # 个人中心
│   ├── service/                    # 业务服务层
│   │   ├── schools/                # 院校特定服务
│   │   │   └── hbut/               # 湖北工业大学
│   │   │       ├── AllSchedule.js  # 全部课程表
│   │   │       ├── Banner.js       # 轮播图
│   │   │       ├── auth.js         # 认证登录
│   │   │       ├── book.js         # 二手书
│   │   │       ├── chat.js         # 聊天
│   │   │       ├── clubs.js        # 社团
│   │   │       ├── ExamInfo.js     # 考试信息
│   │   │       ├── Scores.js       # 成绩
│   │   │       ├── StuInfo.js      # 学生信息
│   │   │       ├── material.js    # 资料
│   │   │       └── ...             # 其他教务 API
│   │   ├── utils/                  # 服务工具
│   │   │   ├── index.js            # 工具导出
│   │   │   └── withCache.js        # 缓存包装器
│   │   ├── AddSchedule.js          # 添加课程
│   │   ├── autoLogin.js            # 自动登录
│   │   ├── getContributor.js       # 获取贡献者
│   │   ├── getLatestCommit.js      # 获取最新提交
│   │   ├── getRepos.js             # 获取仓库
│   │   ├── login.js                # 登录逻辑
│   │   ├── muyuAudio.js            # 木鱼音频
│   │   ├── router.js               # 路由服务
│   │   ├── safeArea.js             # 安全区域
│   │   ├── sendFeedback.js         # 发送反馈
│   │   ├── userInfo.js             # 用户信息管理
│   │   └── weatherInfo.js          # 天气信息
│   ├── store/                      # 状态管理（Zustand）
│   │   ├── index.js                # Store 入口
│   │   ├── storage.js              # 存储工具
│   │   ├── useSettingsStore.js     # 设置 Store
│   │   ├── useThemeStore.js        # 主题 Store
│   │   ├── useUserStore.js         # 用户 Store
│   │   └── useWeatherStore.js      # 天气 Store
│   ├── utils/                      # 工具函数
│   │   ├── business/               # 业务工具
│   │   │   ├── hbut/               # 湖北工业大学业务
│   │   │   │   ├── academicHelper.js      # 学业帮助
│   │   │   │   ├── bannerHelper.js         # 轮播图帮助
│   │   │   │   ├── courseHelper.js         # 课程帮助
│   │   │   │   ├── emptyClassRoom.js       # 空教室
│   │   │   │   ├── examHelper.js           # 考试帮助
│   │   │   │   ├── loginEncrypt.*          # 登录加密（平台差异化）
│   │   │   │   ├── scoresHelper.js         # 成绩帮助
│   │   │   │   ├── timeHelper.js           # 时间帮助
│   │   │   │   └── weekHelper.js           # 周次帮助
│   │   │   ├── contributorHelp.js  # 贡献者帮助
│   │   │   └── semesterHelper.js  # 学期帮助
│   │   ├── common/                 # 通用工具
│   │   │   ├── cache.js            # 缓存管理
│   │   │   ├── checkStuID.js       # 学号校验
│   │   │   ├── cookies.js          # Cookie 管理
│   │   │   ├── getHashCode.js     # 哈希码生成
│   │   │   ├── rex.js              # 正则表达式
│   │   │   ├── runtimeLogger.js   # 运行时日志
│   │   │   └── withCache.js        # 缓存包装
│   │   ├── platform/              # 平台特定工具
│   │   │   ├── request.h5.js       # H5 请求封装
│   │   │   ├── request.weapp.js    # 小程序请求封装
│   │   │   ├── cloudbase.h5.js     # H5 云开发
│   │   │   ├── cloudbase.js        # 云开发
│   │   │   ├── getLocation.*       # 获取位置（平台差异化）
│   │   │   ├── getWeather.js       # 获取天气
│   │   │   └── ...                 # 其他平台工具
│   │   └── react/                  # React 工具
│   │       └── theme.jsx           # 主题配置
│   ├── app.js                      # 应用入口
│   ├── app.config.js               # 应用配置
│   ├── app.css                     # 全局样式
│   ├── app.weapp.js                # 小程序应用入口
│   ├── design-system.css           # 设计系统样式
│   ├── index.html                  # H5 入口 HTML
│   └── README.md                   # 源码目录说明
├── .editorconfig                    # 编辑器配置
├── .eslintrc                        # ESLint 配置
├── .gitignore                       # Git 忽略规则
├── babel.config.js                  # Babel 配置
├── commitlint.config.mjs            # Commit 规范配置
├── index.js                         # 入口文件
├── metro.config.js                  # React Native Metro 配置
├── package.json                     # 项目依赖配置
├── pnpm-lock.yaml                   # pnpm 锁文件
├── pnpm-workspace.yaml             # pnpm 工作区配置
├── project.config.json              # 小程序项目配置
├── project.private.config.json      # 小程序私有配置
├── stylelint.config.mjs             # Stylelint 配置
├── CLAUDE.md                        # Claude 指引
├── CONTRIBUTING.md                  # 贡献指南
├── LICENSE                          # 许可证
└── README.md                        # 项目说明
```

## 使用到的技术
[Taro](https://docs.taro.zone/docs/)

[React](https://zh-hans.react.dev/learn)

[Vite](https://cn.vitejs.dev/)

[Sass](https://sass-lang.com/)

[ESLint](https://eslint.org/)

[Prettier](https://prettier.io/)

[husky](https://typicode.github.io/husky/#/)

## GitHub Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Spinach5/taro_mini&type=date&logscale&legend=top-left)](https://www.star-history.com/?repos=Spinach5%2Ftaro_mini&type=date&logscale=&legend=top-left)
