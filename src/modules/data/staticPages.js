/** 首页功能入口静态数据（后端接入前使用） */

export const studentGroups = [
	{
		title: "主席团",
		items: [
			{
				name: "校学生会主席团",
				rows: [
					{ label: "职责", value: "统筹全校学生会工作，对接各学院分会" },
					{ label: "办公地点", value: "北16 学生一站式服务中心" },
					{ label: "联系", value: "请关注「湖工大学生会」官方公众号" },
				],
			},
		],
	},
	{
		title: "职能部门",
		items: [
			{
				name: "学习部",
				rows: [
					{ label: "职责", value: "学风建设、讲座论坛、学科竞赛宣传" },
					{ label: "招新", value: "每年9月开学季统一招新" },
				],
			},
			{
				name: "文艺部",
				rows: [
					{ label: "职责", value: "校园晚会、歌手大赛等文艺活动组织" },
					{ label: "活动", value: "元旦晚会、毕业晚会、十佳歌手" },
				],
			},
			{
				name: "体育部",
				rows: [
					{ label: "职责", value: "运动会、球类联赛等体育赛事组织" },
					{ label: "活动", value: "校运会、新生杯篮球赛、足球赛" },
				],
			},
			{
				name: "宣传部",
				rows: [
					{ label: "职责", value: "活动摄影、推文排版、新媒体运营" },
					{ label: "技能", value: "欢迎有摄影、设计、文案特长的同学" },
				],
			},
			{
				name: "外联部",
				rows: [
					{ label: "职责", value: "校企合作、赞助洽谈、校友联络" },
					{ label: "说明", value: "需较强沟通与谈判能力" },
				],
			},
		],
	},
	{
		title: "学院分会",
		items: [
			{
				name: "学院学生会",
				rows: [
					{ label: "说明", value: "各学院设有独立学生会，负责院内活动与权益反馈" },
					{ label: "加入", value: "开学后关注学院团委、学生会招新通知" },
				],
			},
		],
	},
];

export const foodGroups = [
	{
		title: "校内食堂",
		items: [
			{
				name: "学府餐厅（北区）",
				rows: [
					{ label: "位置", value: "北区学生公寓附近" },
					{ label: "营业时间", value: "早餐 6:30-9:00，午晚餐 10:30-19:30" },
					{ label: "推荐", value: "麻辣烫、盖浇饭、早餐面点" },
				],
			},
			{
				name: "科教餐厅",
				rows: [
					{ label: "位置", value: "教学区中心" },
					{ label: "营业时间", value: "10:30-19:30" },
					{ label: "推荐", value: "自选快餐，下课高峰建议错峰" },
				],
			},
			{
				name: "民族餐厅",
				rows: [
					{ label: "位置", value: "生活区" },
					{ label: "特色", value: "清真菜品、拉面" },
				],
			},
		],
	},
	{
		title: "周边美食",
		items: [
			{
				name: "南门小吃街",
				rows: [
					{ label: "位置", value: "学校南门对面" },
					{ label: "推荐", value: "烧烤、奶茶、炸鸡，适合聚餐" },
					{ label: "提示", value: "注意卫生，适量消费" },
				],
			},
			{
				name: "东门商业街",
				rows: [
					{ label: "位置", value: "学校东门步行约 5 分钟" },
					{ label: "推荐", value: "火锅、烤鱼、日料" },
				],
			},
		],
	},
];

export const dailyGroups = [
	{
		title: "校内购物",
		items: [
			{
				name: "教育超市",
				rows: [
					{ label: "位置", value: "生活区、教学区均有门店" },
					{ label: "商品", value: "日用品、文具、零食、洗漱用品" },
					{ label: "支付", value: "校园卡、微信、支付宝" },
				],
			},
			{
				name: "北区便利店",
				rows: [
					{ label: "位置", value: "北区宿舍楼下" },
					{ label: "商品", value: "应急日用品、泡面、饮料" },
					{ label: "营业", value: "约 7:00-23:00" },
				],
			},
		],
	},
	{
		title: "校外采购",
		items: [
			{
				name: "大润发 / 沃尔玛",
				rows: [
					{ label: "交通", value: "公交约 20 分钟，适合周末集中采购" },
					{ label: "建议", value: "洗衣液、被子、收纳箱等大件" },
				],
			},
			{
				name: "网上采购",
				rows: [
					{ label: "快递点", value: "校内菜鸟驿站、京东、顺丰点" },
					{ label: "提示", value: "开学季快递较多，错峰取件" },
				],
			},
		],
	},
	{
		title: "新生必备",
		items: [
			{
				name: "建议清单",
				rows: [
					{ label: "洗漱", value: "牙刷牙膏、毛巾、沐浴露、洗衣液" },
					{ label: "宿舍", value: "衣架、收纳盒、插线板、台灯" },
					{ label: "学习", value: "笔记本、笔、文件夹、U盘" },
				],
			},
		],
	},
];

export const mapGroups = [
	{
		title: "教学区",
		items: [
			{
				name: "北教楼",
				rows: [
					{ label: "位置", value: "校园北侧主教学区" },
					{ label: "用途", value: "公共课、专业课教室" },
				],
			},
			{
				name: "南教楼",
				rows: [
					{ label: "位置", value: "校园南侧" },
					{ label: "用途", value: "实验课、机房" },
				],
			},
			{
				name: "图书馆",
				rows: [
					{ label: "位置", value: "校园中心" },
					{ label: "开放", value: "8:00-22:00（期末可能延长）" },
					{ label: "提示", value: "占座请遵守馆规，保持安静" },
				],
			},
		],
	},
	{
		title: "生活区",
		items: [
			{
				name: "北16 学生一站式服务中心",
				rows: [
					{ label: "位置", value: "北区" },
					{ label: "服务", value: "成绩单打印、在读证明、学生事务咨询" },
				],
			},
			{
				name: "校医院",
				rows: [
					{ label: "位置", value: "生活区西侧" },
					{ label: "服务", value: "常见病诊疗、医保报销咨询" },
				],
			},
			{
				name: "体育馆",
				rows: [
					{ label: "位置", value: "东区" },
					{ label: "设施", value: "篮球场、羽毛球馆、健身房" },
				],
			},
		],
	},
	{
		title: "出入口",
		items: [
			{
				name: "南门",
				rows: [
					{ label: "说明", value: "主校门，面向市区，公交站点集中" },
				],
			},
			{
				name: "东门 / 西门",
				rows: [
					{ label: "说明", value: "通往生活区与周边商业街" },
				],
			},
		],
	},
];

export const bookGroups = [
	{
		title: "教材转让",
		items: [
			{
				name: "高等数学（同济版）",
				rows: [
					{ label: "成色", value: "八成新，有少量笔记" },
					{ label: "价格", value: "¥15" },
					{ label: "联系", value: "QQ群「湖工大二手书」私信" },
				],
			},
			{
				name: "大学英语综合教程",
				rows: [
					{ label: "成色", value: "九成新" },
					{ label: "价格", value: "¥10" },
					{ label: "联系", value: "线下北区食堂门口摆摊（周末）" },
				],
			},
			{
				name: "C 语言程序设计",
				rows: [
					{ label: "成色", value: "全新未拆" },
					{ label: "价格", value: "¥20" },
					{ label: "联系", value: "学院QQ群" },
				],
			},
		],
	},
	{
		title: "考研 / 考证",
		items: [
			{
				name: "考研英语词汇书",
				rows: [
					{ label: "成色", value: "七成新" },
					{ label: "价格", value: "¥12" },
					{ label: "备注", value: "含配套网课激活码（已用）" },
				],
			},
			{
				name: "四六级真题集",
				rows: [
					{ label: "成色", value: "八成新" },
					{ label: "价格", value: "¥8" },
				],
			},
		],
	},
	{
		title: "交易提示",
		items: [
			{
				name: "安全须知",
				rows: [
					{ label: "建议", value: "当面交易，检查书籍品相后再付款" },
					{ label: "支付", value: "优先微信/支付宝当面转账，避免先款后货" },
					{ label: "说明", value: "以上为示例数据，正式功能上线后可发布与搜索" },
				],
			},
		],
	},
];
