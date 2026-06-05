import { View } from "@tarojs/components";
import GridItem from "./GridItem";

// 功能入口配置数据
const gridItems = [
	{ url: "/modules/pages/exam/index", icon: "clipboard-text-outline", text: "考试" },
	{ url: "/modules/pages/student/index", icon: "finance", text: "成绩" },
	{ url: "/modules/pages/empty_room/index", icon: "door-open", text: "空教室" },
	{ url: "/modules/pages/muyu/index", icon: "instrument-triangle", text: "电子木鱼" },

	{ url: "/modules/pages/club/index", icon: "account-supervisor-circle", text: "社团" },
	{ url: "/modules/pages/food/index", icon: "food-variant", text: "美食" },
	{ url: "/modules/pages/book/index", icon: "book-open-page-variant", text: "书籍" },
	{ url: "/modules/pages/affair/index", icon: "plus-box-multiple-outline", text: "其他" },
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
