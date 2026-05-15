import { View, Text, ScrollView } from "@tarojs/components";
import "./courseGrid.css";
import { useState } from "react";
import { getBgFromColor } from "../utils/getHashCode";

export default function CourseGrid({ gridCourses }) {
	const [modalVisible, setModalVisible] = useState(false);
	const [currentCourse, setCurrentCourse] = useState(null);

	const openModal = (course) => {
		setCurrentCourse(course);
		setModalVisible(true);
	};

	const closeModal = () => {
		setModalVisible(false);
		setCurrentCourse(null);
	};
	return (
		<>
			{gridCourses.map((course) => (
				<View
					key={course.id}
					className="course-card"
					style={{
						gridColumn: course.col + 2,
						gridRow: `${course.row + 1} / span ${course.rowSpan}`,
						backgroundColor: getBgFromColor(course.color),
					}}
					onClick={() => openModal(course)}
				>
					<Text
						className="course-name"
						style={{
							color: course.color,
						}}
					>
						{course.name}
					</Text>
					<Text
						className="course-room"
						style={{
							color: course.color,
						}}
					>
						{course.room}
					</Text>
				</View>
			))}
			{/* 弹窗 */}
			{modalVisible && currentCourse && (
				<View className="course-info" onClick={closeModal}>
					{/* 窗口 */}
					<View
						style={{
							width: "80%",
							maxWidth: "500px",
							backgroundColor: "#fff",
							borderRadius: "16px",
							overflow: "hidden",
							padding: "10px",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* 标题 */}
						<View
							style={{
								textAlign: "center",
								padding: "16px",
								fontSize: "30px",
								fontWeight: "bold",
								color: "#000",
							}}
						>
							课程信息
						</View>

						{/* 可滚动内容 */}
						<ScrollView
							scrollY
							style={{
								maxHeight: "60vh",
								padding: "5px",
							}}
						>
							<View
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "12px",
								}}
							>
								<DetailRow
									label="课程名称"
									value={currentCourse.name}
								/>
								<DetailRow
									label="教师"
									value={currentCourse.teacher}
								/>
								<DetailRow
									label="教室"
									value={currentCourse.room}
								/>
								<DetailRow
									label="课程性质"
									value={currentCourse.kcxz}
								/>
								<DetailRow
									label="学分"
									value={currentCourse.xf}
								/>
								<DetailRow
									label="教学班组成"
									value={currentCourse.jxbzc}
								/>
								<DetailRow
									label="周次"
									value={currentCourse.weeks}
								/>
								<DetailRow
									label="节次"
									value={currentCourse.periods}
								/>
								<DetailRow
									label="星期"
									value={`星期${currentCourse.weekDay}`}
								/>
							</View>
						</ScrollView>
					</View>
				</View>
			)}
		</>
	);
}
function DetailRow({ label, value }) {
	const displayValue = value && value !== "undefined" ? value : "未知";
	return (
		<View
			style={{
				display: "flex",
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "flex-start",
			}}
		>
			<Text
				style={{
					fontWeight: "bold",
					fontSize: "16px",
					color: "#333",
					flexShrink: 0,
				}}
			>
				{label}：
			</Text>
			<Text
				style={{
					fontSize: "16px",
					color: "#555",
					flex: 1,
					textAlign: "left",
					wordBreak: "break-word",
					whiteSpace: "normal",
				}}
			>
				{displayValue}
			</Text>
		</View>
	);
}
