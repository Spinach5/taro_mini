import { View, Text } from "@tarojs/components";

function getBgFromColor(color) {
	return color.replace("hsl", "hsla").replace(")", ", 0.2)");
}

export default function CourseGrid({ gridCourses }) {
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
						padding: "10px",
						borderRadius: "8px",
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
						borderRight: "1px solid #e0e0e0",
						borderBottom: "1px solid #e0e0e0",
						height: "95%",
						width: "95%",
						margin:"auto",
						zIndex: 2,
					}}
				>
					<Text
						className="course-name"
						style={{
							fontWeight: "bold",
							fontSize: "12px",
							lineHeight: 1.4,
							color: course.color,
							display: "-webkit-box",
							WebkitBoxOrient: "vertical",
							WebkitLineClamp: 3,
							overflow: "hidden",
							textOverflow: "ellipsis",
							wordBreak: "break-word",
							marginBottom: "auto"
						}}
					>
						{course.name}
					</Text>
					<Text
						className="course-room"
						style={{
							fontSize: "12px",
							color: course.color,
							marginTop: "auto",
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
		</>
	);
}
