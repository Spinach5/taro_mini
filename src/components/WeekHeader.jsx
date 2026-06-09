import { View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import "./WeekHeader.css";

/**
 * 解析 "MM.DD-MM.DD" 格式的日期范围，生成一周 7 天的日期数组
 * @param {string} rqfw - 如 "03.02-03.08"
 * @returns {{ date: number, month: number, weekStr: string }}
 */
const parseWeekDates = (rqfw) => {
	const weekStrMap = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
	const [startStr] = rqfw.split("-"); // "03.02"
	const [monthStr, dayStr] = startStr.split(".");
	const startMonth = parseInt(monthStr, 10);
	const startDay = parseInt(dayStr, 10);
	const startDate = new Date(new Date().getFullYear(), startMonth - 1, startDay);

	return Array.from({ length: 7 }, (_, i) => {
		const d = new Date(startDate);
		d.setDate(startDate.getDate() + i);
		return {
			date: d.getDate(),
			month: d.getMonth() + 1,
			weekStr: weekStrMap[i],
		};
	});
};

export default function WeekHeader({ currentWeek, weekDataList = [] }) {
	const [currentMonth, setCurrentMonth] = useState(0);
	const [weekDates, setWeekDates] = useState([]);
	const [todayDate] = useState(new Date());

	useEffect(() => {
		if (!currentWeek || !weekDataList.length) return;
		const weekInfo = weekDataList.find((w) => Number(w.zc) === Number(currentWeek));
		if (!weekInfo?.rqfw) return;
		const dates = parseWeekDates(weekInfo.rqfw);
		setWeekDates(dates);
		setCurrentMonth(dates[0]?.month || 0);
	}, [currentWeek, weekDataList]);

	const isToday = (dateItem) =>
		dateItem.date === todayDate.getDate() &&
		dateItem.month === todayDate.getMonth() + 1;

	return (
		<View className="week-header">
			<View
				className="week-grid"
				style={{
					display: "grid",
					gridTemplateColumns: "12.5% repeat(7, 1fr)",
				}}
			>
				<View className="month-box">
					<Text className="month-number">{currentMonth}</Text>
					<Text className="month-unit">月</Text>
				</View>
				{weekDates.map((item, idx) => {
					const today = isToday(item);
					return (
						<View
							key={idx}
							className={`week-day-box${today ? " today" : ""}`}
							style={
								today
									? {
											backgroundColor: "var(--color-bg-card, #fff)",
											borderRadius: "8px",
										}
									: undefined
							}
						>
							<Text
								className="day-number"
								style={today ? { color: "#007aff", fontWeight: "bold" } : undefined}
							>
								{item.date}
							</Text>
							<Text
								className="day-week"
								style={today ? { color: "#007aff", fontWeight: "bold" } : undefined}
							>
								{item.weekStr}
							</Text>
						</View>
					);
				})}
			</View>
		</View>
	);
}
