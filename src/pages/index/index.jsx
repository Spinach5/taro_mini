import { useState, useEffect } from "react";
import { Text } from "@tarojs/components";
import Taro, { useRouter, useDidShow, usePullDownRefresh } from "@tarojs/taro";
import "./index.css";
import SafeAreaView from "../../components/SafeAreaView";
import HeadStatus from "../../components/HeadStatus";
import IndexSwiper from "../../components/IndexSwiper";
import Btn from "../../components/Btn";
import GridContainer from "../../components/GridContainer";
import weatherManager from "../../service/weatherInfo";
import { getBanner } from "../../service";
import userManager from "../../service/userInfo";
import { MaterialCommunityIcons } from "taro-icons";

export default function Index() {
	const router = useRouter();
	const currentPath = router.path.split("?")[0];
	const [weather, setWeather] = useState(null);
	const [bannerList, setBannerList] = useState([]);

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

	// 获取轮播图
	const fetchBanners = () => {
		if (!userManager.checkLogin()) return;
		getBanner()
			.then((images) => {
				if (images && images.length > 0) {
					setBannerList(images);
				}
			})
			.catch(() => {
				// 静默失败，展示默认轮播图
			});
	};

	useEffect(() => {
		fetchBanners();
	}, []);

	// 每次页面显示时检测登录状态：已登出则清空轮播图
	useDidShow(() => {
		if (!userManager.checkLogin()) {
			setBannerList([]);
		}
	});

	// 下拉刷新：重新获取天气和轮播图
	usePullDownRefresh(() => {
		Promise.all([
			weatherManager.update().then(() => {
				const current = weatherManager.getCurrentWeather();
				if (current) setWeather(current);
			}),
			getBanner(true).then((images) => {
				if (images && images.length > 0) setBannerList(images);
			}),
		]).finally(() => {
			Taro.stopPullDownRefresh();
		});
	});

	return (
		<SafeAreaView currentPath={currentPath}>
			<HeadStatus text="首页">
				<Btn onClick={() => Taro.navigateTo({ url: "/modules/pages/weather/index" })} className="weather-icon">
				{weather ? (
					<>
						<MaterialCommunityIcons
							name={weather.weatherIcon}
							color="#47a5fd"
							size={40}
						/>
						<Text className="weather-temp">{weather.temperature}°</Text>
					</>
				) : (
					<Text className="weather-temp">--°</Text>
				)}
			</Btn>
			</HeadStatus>

			<IndexSwiper bannerList={bannerList} />
			<GridContainer />
		</SafeAreaView>
	);
}
