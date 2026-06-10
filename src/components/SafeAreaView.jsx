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

	const bgLight = "linear-gradient(to bottom, #47a5fd 0%, #cce5ff 28%, #f2f5f9 100%)";
	const bgDark = "linear-gradient(to bottom, rgb(26,29,46) 0%, rgb(35,39,64) 100%)";

	return (
		<>
			<View
				className={`${className || ""} safe-area-view${darkMode ? " is-dark" : ""}`}
				style={{
					width: "100%",
					//height: "100%",
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
					paddingTop: `${safeArea.top}px`,
					paddingBottom: currentPath
						? `${tabBarHeight}px`
						: `${safeArea.bottom || 0}px`,
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
