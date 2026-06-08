import { useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import { useRouter } from "@tarojs/taro";
import "./index.css";
import SafeAreaView from "../../components/SafeAreaView";
import HeadStatus from "../../components/HeadStatus";
import IndexSwiper from "../../components/IndexSwiper";
import Btn from "../../components/Btn";
import GridContainer from "../../components/GridContainer";
import weatherManager from "../../service/weatherInfo";
import { MaterialCommunityIcons } from "taro-icons";

export default function Index() {
	const router = useRouter();
	const currentPath = router.path.split("?")[0];
	const [weather, setWeather] = useState(null);

	// 初始化天气数据
	useEffect(() => {
		weatherManager.init().then(() => {
			const current = weatherManager.getCurrentWeather();
			if (current) {
				setWeather(current);
			}
		}).catch(() => {
			// 静默失败，不影响页面使用
		});
	}, []);

	return (
		<SafeAreaView currentPath={currentPath}>
			<HeadStatus text="首页">
				<Btn>
				{weather ? (
					<>
						<MaterialCommunityIcons
							name={weather.weatherIcon}
							color="#47a5fd"
							size={40}
						/>
						<Text className="weather-temp">{weather.temperature}°C</Text>
					</>
				) : (
					<Text className="weather-temp">--°</Text>
				)}
			</Btn>
			</HeadStatus>

			<IndexSwiper />
			<GridContainer />
		</SafeAreaView>
	);
}
