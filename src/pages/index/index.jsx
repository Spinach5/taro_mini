import { useState, useCallback } from "react";
import { View } from "@tarojs/components";
import Taro,{ useRouter }from "@tarojs/taro";
import "./index.css";
import SafeAreaView from "../../components/SafeAreaView";
import HeadStatus from "../../components/HeadStatus";
import IndexSwiper from "../../components/IndexSwiper";
import GridContainer from "../../components/GridContainer";
import getLocation from "../../utils/getLocation"
import getArea from "../../utils/getArea"

async function getH5Location() {
	const {latitude, longitude} = await getLocation();
	console.log(latitude, longitude);
	return await getArea(latitude, longitude);
}

export default function Index() {
	const router = useRouter();
		const currentPath = router.path.split("?")[0];
	const [loading, setLoading] = useState(false);

	const handleGetLocation = useCallback(async () => {
		setLoading(true);
		try {
			await getH5Location();
		} catch (err) {
			Taro.showToast({ title: "获取位置失败", icon: "none" });
		} finally {
			setLoading(false);
		}
	}, []);

	return (
		<SafeAreaView currentPath={currentPath}>
			<HeadStatus text="首页" />
			<IndexSwiper />
			<GridContainer />
			<View className="button-wrapper">
				<View className="button" onClick={handleGetLocation}>
					{loading ? "定位中..." : "获取当前位置"}
				</View>
			</View>
		</SafeAreaView>
	);
}
