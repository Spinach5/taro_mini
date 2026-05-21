import { View } from "@tarojs/components";
import GridItem from "./GridItem";

// 功能入口配置数据
const gridItems = [
	{ url: "/modules/pages/student/index", icon: "user", text: "学生会" },
	{ url: "/modules/pages/club/index", icon: "tag", text: "社团" },
	{ url: "/modules/pages/food/index", icon: "shopping-bag", text: "美食" },
	{ url: "/modules/pages/affair/index", icon: "file-generic", text: "行政事务" },
	{ url: "/modules/pages/muyu/index", icon: "heart", text: "电子木鱼" },
	{ url: "/modules/pages/daily/index", icon: "shopping-cart", text: "日常用品" },
	{ url: "/modules/pages/map/index", icon: "map-pin", text: "地图" },
	{ url: "/modules/pages/book/index", icon: "bookmark", text: "二手书" },
];

export default function GridContainer({ className = "" }) {
	return (
		<View
			className={`${className}`}
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(4, 1fr)",
				gap: "10px",
				padding: "15px",
				background: "#fff",
				borderRadius: "16px",
			}}
		>
			{gridItems.map((item, index) => (
				<GridItem
					key={index}
					url={item.url}
					icon={item.icon}
					text={item.text}
				/>
			))}
		</View>
	);
}
