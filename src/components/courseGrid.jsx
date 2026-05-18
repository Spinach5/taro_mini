import { View, Text } from "@tarojs/components";
import "./courseGrid.css";
import { getBgFromColor } from "../utils/getHashCode";

export default function CourseGrid({ gridCourses, rowCount = 1, onCardClick }) {
  const safeCourses = gridCourses || [];

  // 记录哪些位置已被课程卡片占用（用于跳过空白格）
  const occupied = Array(rowCount)
    .fill()
    .map(() => Array(7).fill(false));
  safeCourses.forEach((course) => {
    for (let r = course.row; r < course.row + course.rowSpan; r++) {
      if (r >= 0 && r < rowCount) {
        occupied[r][course.col] = true;
      }
    }
  });

  // 生成空白单元格
  const blankCells = [];
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < 7; col++) {
      if (!occupied[row][col]) {
        blankCells.push(
          <View
            key={`empty-${row}-${col}`}
            className="grid-cell"  // 可自己在 CSS 中定义样式，也可保留内联样式保证基本边框
            style={{
              gridColumn: col + 1,
              gridRow: row + 1,
            }}
          />
        );
      }
    }
  }

  // 课程卡片（保持原有结构不变）
  const cards = safeCourses.map((course) => (
    <View
      key={course.id}
      className="course-card"
      style={{
        gridColumn: course.col + 1,
        gridRow: `${course.row + 1} / span ${course.rowSpan}`,
        backgroundColor: getBgFromColor(course.color),
      }}
      onClick={() => onCardClick && onCardClick(course)}
    >
      <Text className="course-name" style={{ color: course.color }}>
        {course.name}
      </Text>
      <Text className="course-room" style={{ color: course.color }}>
        {course.room}
      </Text>
    </View>
  ));

  return (
    <View className="course-grid-container">
      {cards}
      {blankCells}
    </View>
  );
}
