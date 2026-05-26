import { View } from "@tarojs/components";
import { getSafeArea } from "../service/safeArea";
import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import TabBar from "./TabBar";
import { useTheme } from "../utils/theme";

export default function SafeAreaView({ children, currentPath, className }) {
	const [tabBarHeight, setTabBarHeight] = useState(50);
	const safeArea = getSafeArea();
	const { darkMode } = useTheme();

	const getTabBarHeight = () => {
		const query = Taro.createSelectorQuery();
		query.select(".tab-bar").boundingClientRect();
		query.exec((res) => {
			if (res[0]?.height) {
				setTabBarHeight(res[0].height);
			}
		});
	};

	useEffect(() => {
		setTimeout(getTabBarHeight, 100);
		Taro.eventCenter.on("resize", getTabBarHeight);
		return () => {
			Taro.eventCenter.off("resize", getTabBarHeight);
		};
	}, []);

	const bgLight = "linear-gradient(to bottom, rgb(71,165,253) 0%, rgb(255,255,255) 40%)";
	const bgDark = "linear-gradient(to bottom, rgb(26,26,46) 0%, rgb(22,33,62) 40%)";

	return (
		<>
			<View
				className={`${className || ""} safe-area-view${darkMode ? " is-dark" : ""}`}
				style={{
					height: "100%",
					width: "100%",
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
					paddingTop: `${safeArea.top}px`,
					paddingBottom: `${tabBarHeight + (safeArea.bottom || 0)}px`,
					paddingLeft: "8px",
					paddingRight: "8px",
					background: darkMode ? bgDark : bgLight,
					boxSizing: "border-box",
				}}
			>
				{children}
			</View>
			<TabBar currentPath={currentPath} />
		</>
	);
}
