import { View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import { getAllSchedule } from "../service/hubt/AllSchedule";
import { getTimeTable } from "../service/hubt/GetTimeTable";
import TimeSlot from "./TimeSlot";
import "./courseTable.scss";

// 工具函数：字符串哈希
function getHashCode(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

function getColorFromName(courseName) {
	const hue = getHashCode(courseName) % 360;
	return `hsl(${hue}, 70%, 55%)`;
}

function getBgFromColor(color) {
	return color.replace("hsl", "hsla").replace(")", ", 0.2)");
}

export default function CourseTable({ currentWeek }) {
	const [courses, setCourses] = useState([]);
	const [timeTable, setTimeTable] = useState([]);
	const [gridCourses, setGridCourses] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([
			getAllSchedule("2025-2026-2"),
			getTimeTable("2025-2026-2"),
		])
			.then(([scheduleData, timeData]) => {
				setCourses(scheduleData);
				setTimeTable(timeData);
			})
			.catch((err) => console.error("获取课表失败", err))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		if (loading || !currentWeek || !timeTable.length || !courses.length)
			return;

		const periodIndexMap = {};
		timeTable.forEach((item, idx) => {
			periodIndexMap[parseInt(item.jc)] = idx;
		});

		const weekCourses = courses.filter((course) =>
			course.zcstr?.some(
				(weekNum) => parseInt(weekNum) === parseInt(currentWeek),
			),
		);

		const gridItems = weekCourses
			.map((course, idx) => {
				const weekDay = parseInt(course.xingqi);
				const colIndex = weekDay - 1;
				const periods = course.djc.map((p) => parseInt(p));
				if (!periods.length) return null;
				const startPeriod = Math.min(...periods);
				const endPeriod = Math.max(...periods);
				const startRow = periodIndexMap[startPeriod];
				const endRow = periodIndexMap[endPeriod];
				if (startRow === undefined || endRow === undefined) return null;
				const rowSpan = endRow - startRow + 1;
				return {
					id: `${course.kcmc}_${course.xingqi}_${startPeriod}_${idx}`,
					name: course.kcmc,
					room: course.croommc,
					teacher: course.tmc,
					col: colIndex,
					row: startRow,
					rowSpan: rowSpan,
					color: getColorFromName(course.kcmc),
				};
			})
			.filter((item) => item !== null);

		setGridCourses(gridItems);
	}, [currentWeek, courses, timeTable, loading]);

	const rowCount = timeTable.length;

	if (loading || rowCount === 0) {
		return <View className="course-table-loading">加载课表中...</View>;
	}

	return (
		<View className="course-table">
			<View
				className="grid-container"
				style={{
					display: "grid",
					gridTemplateColumns: "12.5% repeat(7, 1fr)",
					gridAutoRows: "minmax(80px, auto)", // 行高自适应，最小80px
				}}
			>
				{/* 左侧时间列 */}
				{timeTable.map((item, idx) => (
					<View
						key={`time-${idx}`}
						style={{
							gridColumn: 1,
							gridRow: idx + 1,
						}}
					>
						<TimeSlot
							startTime={item.startTime}
							endTime={item.endTime}
							order={`${item.jc}`}
						/>
					</View>
				))}

				{/* 空白网格背景 */}
				{Array.from({ length: rowCount * 7 }).map((_, index) => {
					const row = Math.floor(index / 7);
					const col = index % 7;
					const isOccupied = gridCourses.some(
						(c) =>
							c.col === col &&
							c.row <= row &&
							row < c.row + c.rowSpan,
					);
					if (isOccupied) return null;
					return (
						<></>
						// <View
						// 	key={`empty-${row}-${col}`}
						// 	style={{
						// 		gridColumn: col + 2,
						// 		gridRow: row + 1,
						// 		borderRight: "1px solid #e0e0e0",
						// 		borderBottom: "1px solid #e0e0e0",
						// 		backgroundColor: "#fafafa",
						// 	}}
						// />
					);
				})}

				{/* 课程卡片 */}
				{gridCourses.map((course) => (
					<View
						key={course.id}
						className="course-card"
						style={{
							gridColumn: course.col + 2,
							gridRow: `${course.row + 1} / span ${course.rowSpan}`,
							backgroundColor: getBgFromColor(course.color),
							margin: "5px",
							padding: "10px",
							borderRadius: "8px",
							display: "flex",
							flexDirection: "column",
							overflow: "hidden",
							borderRight: "1px solid #e0e0e0",
							borderBottom: "1px solid #e0e0e0",
							zIndex: 2,
						}}
					>
						<Text
							className="course-name"
							style={{
								fontWeight: "bold",
								fontSize: "14px",
								lineHeight: 1.4,
								color: course.color,
								display: "-webkit-box",
								WebkitBoxOrient: "vertical",
								WebkitLineClamp: 3,
								overflow: "hidden",
								textOverflow: "ellipsis",
								wordBreak: "break-word",
							}}
						>
							{course.name}
						</Text>
						<Text
							className="course-room"
							style={{
								fontSize: "12px",
								color: course.color,
								marginTop: "4px",
								display: "-webkit-box",
								WebkitBoxOrient: "vertical",
								WebkitLineClamp: 2,
								overflow: "hidden",
								textOverflow: "ellipsis",
								wordBreak: "break-word",
							}}
						>
							{course.room}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}
