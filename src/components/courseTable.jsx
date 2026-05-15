import { View } from "@tarojs/components";
import { useEffect, useState } from "react";
import { getAllSchedule } from "../service/hubt/AllSchedule";
import { getTimeTable } from "../service/hubt/GetTimeTable";
import TimeColumn from "./courseTImeColumn.jsx";
import CourseGrid from "./courseGrid";
import { getColorFromName } from "../utils/getHashCode.js";
import "./courseTable.css";

export default function CourseTable({ currentWeek, onSwipeWeek }) {
	const [courses, setCourses] = useState([]);
	const [timeTable, setTimeTable] = useState([]);
	const [gridCourses, setGridCourses] = useState([]);
	const [loading, setLoading] = useState(true);
	const [touchStartX, setTouchStartX] = useState(0);
	const [touchStartY, setTouchStartY] = useState(0);
	const SWIPE_THRESHOLD = 50; // 滑动阈值（px）

	const handleTouchStart = (e) => {
		const touch = e.touches[0];
		setTouchStartX(touch.clientX);
		setTouchStartY(touch.clientY);
	};
	const handleTouchEnd = (e) => {
		const touch = e.changedTouches[0];
		const deltaX = touch.clientX - touchStartX;
		const deltaY = touch.clientY - touchStartY;
		// 水平滑动为主且超过阈值
		if (
			Math.abs(deltaX) > SWIPE_THRESHOLD &&
			Math.abs(deltaX) > Math.abs(deltaY)
		) {
			if (deltaX < 0) {
				// 左滑 → 下一周
				onSwipeWeek && onSwipeWeek("next");
			} else {
				// 右滑 → 上一周
				onSwipeWeek && onSwipeWeek("prev");
			}
		}
	};

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
					kcxz: course.kcxz || "未知",
					xf: course.xf || "未知",
					jxbzc: course.jxbzc || "未知",
					weeks: course.zcstr ? course.zcstr.join(",") : "未知",
					periods: course.djc.join(","),
					weekDay: course.xingqi,
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
		<View
			className="course-table"
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}
			// 可选：阻止滚动穿透（根据需要）
			catchMove
		>
			<View className="grid-container">
				<TimeColumn timeTable={timeTable} />
				<CourseGrid gridCourses={gridCourses} />
			</View>
		</View>
	);
}
