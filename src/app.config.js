/* eslint-disable no-undef */
export default defineAppConfig({
	pages: [
		'pages/index/index',
		"pages/course/index",
		"pages/user/index",
		"pages/test/index",
	],

	window: {
		backgroundTextStyle: 'light',
		navigationBarBackgroundColor: '#fff',
		navigationBarTitleText: 'WeChat',
		navigationBarTextStyle: 'black',
		navigationStyle: 'custom'
	},
	tabBar: {
		custom:true,
		color: '#666666',
		selectedColor: '#007bff',
		backgroundColor: '#ffffff',
		borderStyle: 'white',
		list: [
			{
				pagePath: "pages/index/index",
				text: "首页",
				iconPath: "",
				selectedIconPath: "",
			},
			{
				pagePath: "pages/course/index",
				text: "课程",
				iconPath: "",
				selectedIconPath: "",
			},
			{
				pagePath: "pages/test/index",
				text: "测试",
				iconPath: "",
				selectedIconPath: "",
			},
			{
				pagePath: "pages/user/index",
				text: "我的",
				iconPath: "",
				selectedIconPath: "",
			},

		]
	},
	subPackages: [
    {
      root: 'modules',
      pages: [
        'pages/login/index', // 分包页面
		'pages/copyright/index'
      ],
    }
  ],

});
