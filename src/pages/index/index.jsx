import { useState } from "react";
import { View } from "@tarojs/components";
import "./index.css";
import SafeAreaView from "../../components/SafeAreaView";
import HeadStatus from "../../components/HeadStatus";
import IndexSwiper from "../../components/IndexSwiper";
import GridContainer from "../../components/GridContainer";
import { useLoad, useDidShow, useDidHide, useRouter } from "@tarojs/taro";

export default function Index() {
	const router = useRouter();
	const currentPath = router.path.split("?")[0];
	const [, setTick] = useState(0);

	useLoad(() => {});

	// 每次回到首页时触发重渲染，确保 GridContainer 读取最新存储
	useDidShow(() => {
		setTick((t) => t + 1);
	});

	useDidHide(() => {});
	return (
		<SafeAreaView currentPath={currentPath}>
			<HeadStatus text="首页" />
			{/* 轮播图组件 */}
			<IndexSwiper />
			{/* 功能展示组件 */}
			<GridContainer />

		</SafeAreaView>
	);
}
