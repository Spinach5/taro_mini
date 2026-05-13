import { useState ,useEffect} from "react";
import { Text, View, Image } from "@tarojs/components";
import SafeAreaView from "../../components/safeView";
import "./index.scss";
import Btn from "../../components/Btn";
import CourseHeader from "../../components/courseHeader";
import WeekHeader from "../../components/courseWeek";
import TimeContainer from "../../components/TimeContainer";
import { getCurrentWeek } from "../../service/hubt/CurrentWeek";

export default function Index() {
const [currentWeek, setCurrentWeek] = useState(null);
useEffect(() => {
	getCurrentWeek().then((week) => setCurrentWeek(week));
}, []);

const handleWeekChange = (week) => {
	setCurrentWeek(week);
};

if (currentWeek === null) return <View>加载中...</View>;
	return (
		<SafeAreaView>
			<CourseHeader
				currentWeek={currentWeek}
				onWeekChange={handleWeekChange}
			/>
			<WeekHeader currentWeek={currentWeek} />
			<TimeContainer />
		</SafeAreaView>
	);
}
