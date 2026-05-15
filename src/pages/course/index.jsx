// index.jsx
import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import { View, ScrollView } from "@tarojs/components";
import SafeAreaView from "../../components/safeView";
import CourseHeader from "../../components/courseHeader";
import WeekHeader from "../../components/courseWeek";
import CourseTable from "../../components/courseTable";
import { getCurrentWeek } from "../../service/hubt/CurrentWeek";
import { getAllWeek } from "../../service/hubt/GetAllWeek";
import "./index.css";

export default function Index() {
	const [currentWeek, setCurrentWeek] = useState(null);
	const [weekList, setWeekList] = useState([]); // 周数列表 [1,2,...20]
	const [minWeek, setMinWeek] = useState(1);
	const [maxWeek, setMaxWeek] = useState(1);

	useEffect(() => {
		getCurrentWeek().then((week) => setCurrentWeek(week));
		getAllWeek().then((list) => {
			setWeekList(list);
			if (list && list.length) {
				setMinWeek(Math.min(...list));
				setMaxWeek(Math.max(...list));
			}
		});
	}, []);

	const handleWeekChange = (week) => {
		setCurrentWeek(week);
	};

	const handleSwipeWeek = (direction) => {
		let newWeek = currentWeek;
		if (direction === "prev") {
			newWeek = currentWeek - 1;
		} else if (direction === "next") {
			newWeek = currentWeek + 1;
		}
		if (newWeek < minWeek || newWeek > maxWeek) {
			Taro.showToast({
				title:
					direction === "prev" ? "已是最小周" : "已是最大周",
				icon: "error",
				duration: 1500,
			});
			return;
		}
		setCurrentWeek(newWeek);
	};

	if (currentWeek === null) return <View>加载中...</View>;

	return (
		<SafeAreaView>
			<CourseHeader
				currentWeek={currentWeek}
				onWeekChange={handleWeekChange}
			/>
			<WeekHeader currentWeek={currentWeek} />
			<CourseTable
				currentWeek={currentWeek}
				onSwipeWeek={handleSwipeWeek}
				weekRange={{ min: minWeek, max: maxWeek }}
			/>
		</SafeAreaView>
	);
}
