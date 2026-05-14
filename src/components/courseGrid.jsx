import { View, Text } from "@tarojs/components";

/**
 * 课表卡片背景,将颜色变淡（提高亮度、降低饱和度）
 * @param {string} color - 格式如 "hsl(120, 70%, 55%)"
 * @returns {string} 变淡后的颜色，格式 "hsl(hue, 30%, 85%)" 或带透明度
 */
function getBgFromColor(color) {
  // 匹配 hsl(数字, 数字%, 数字%)
  const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return "rgba(200,200,200,0.2)"; // 降级

  const hue = parseInt(match[1]);
  // 原饱和度一般为70%，变淡后降到 30% 左右
  const sat = 90;
  // 原亮度一般为55%，变淡后提高到 85% 左右
  const light = 85;

  // 如果需要半透明背景，可以在后面加上 alpha，例如：
  // return `hsla(${hue}, ${sat}%, ${light}%, 0.8)`;
  // 如果不需透明，直接返回 hsl
  return `hsl(${hue}, ${sat}%, ${light}%)`;
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
