
export default defineAppConfig({
  lazyCodeLoading: "requiredComponents", // 按需加载
  pages: ["pages/index/index", "pages/course/index", "pages/user/index"],
  permission: {
    "scope.userLocation": {
      desc: "你的位置信息将用于获取当地天气信息" // ⚠️ 必须填写使用说明
    }
  },
  requiredPrivateInfos: ["getLocation"], // 声明需要使用的隐私接口

  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "WeChat",
    navigationBarTextStyle: "black",
    navigationStyle: "custom"
  },
  tabBar: {
    custom: true,
    color: "#666666",
    selectedColor: "#007bff",
    backgroundColor: "#ffffff",
    borderStyle: "white",
    list: [
    {
      pagePath: "pages/index/index",
      text: "首页"
    },
    {
      pagePath: "pages/course/index",
      text: "课程"
    },
    {
      pagePath: "pages/user/index",
      text: "我的"
    }]

  },
  subPackages: [
  {
    root: "modules",
    pages: (() => {
      const base = [
        "pages/login/index",
        "pages/club/index",
        "pages/club/detail/index",
        "pages/club/add/index",
        "pages/muyu/index",
        "pages/affair/index",
        "pages/student/index",
        "pages/food/index",
        "pages/exam/index",
        "pages/empty_room/index",
        "pages/book/index",
        "pages/book/detail/index",
        "pages/runtimeLog/index",
        "pages/repo/index",
        "pages/settings/index",
        "pages/join/index",
        "pages/feedback/index",
        "pages/weather/index",
        "pages/webview/index",
        "pages/plan/index",
      ];
      // 二手书交易 + 聊天界面：由环境变量控制是否打包
      if (process.env.TARO_APP_ENABLE_BOOK_TRADE === "true") {
        base.push(
          "pages/book/edit/index",
          "pages/book/buy/index",
          "pages/chat/list/index",
          "pages/chat/detail/index",
        );
      }
      return base;
    })(),
  }
]

});
