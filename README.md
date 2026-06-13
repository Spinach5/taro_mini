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
### 小程序开发者工具
下载并打开微信开发者工具，然后选择项目根目录进行预览。

需要注意开发者工具的项目设置：

- 需要设置关闭 ES6 转 ES5 功能，开启可能报错
- 需要设置关闭上传代码时样式自动补全，开启可能报错
- 需要设置关闭代码压缩上传，开启可能报错

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
