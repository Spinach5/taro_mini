import { View } from "@tarojs/components";
import { useEffect, useState } from "react";
import { getTimeTable } from "../service/hubt/GetTimeTable";
import TimeSlot from "./TimeSlot";
import "./TimeContainer.scss"; // 用于隐藏滚动条的样式

/**
 * 课程时间段容器组件
 * @param {string} className - 外部传入的样式类名
 */
export default function TimeContainer({ className = "" }) {
	const [timeTable, setTimeTable] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// 获取时间表数据
		getTimeTable("2025-2026-2")
			.then((data) => {
				setTimeTable(data);
				setLoading(false);
			})
			.catch((err) => {
				console.error("获取时间表失败:", err);
				setLoading(false);
			});
	}, []);

	if (loading) {
		return (
			<View
				className={`time-container ${className}`}
				style={{
					width: "12.5%", // 八分之一宽度
					display: "flex",
					flexDirection: "column",
					justifyContent: "flex-start",
					alignItems: "stretch",
					// overflowY: "auto",
				}}
			>
				{/* 可显示加载占位符 */}
			</View>
		);
	}

	return (
		<View
			className={`time-container ${className}`}
			style={{
				width: "12.5%", // 八分之一宽度
				height: "100%", // 高度自适应
				display: "flex",
				flexDirection: "column",
				justifyContent: "flex-start",
				alignItems: "stretch",
				// overflowY: "auto", // 允许垂直滚动
			}}
		>
			{timeTable.map((item) => (
				<TimeSlot
					key={item.jc}
					startTime={item.startTime}
					endTime={item.endTime}
					order={`${item.jc}`}
					style={{ height: "80px" }} // 可以在 TimeSlot 组件内接收 style 属性
				/>
			))}
		</View>
	);
}
