import { View, Text, ScrollView } from "@tarojs/components";

export default function CourseInfoModal({ visible, course, onClose }) {
  if (!visible || !course) return null;

  const DetailRow = ({ label, value }) => {
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
  };

  return (
    <View className="modal-mask" onClick={onClose}>
      <View className="modal-container" onClick={(e) => e.stopPropagation()}>
        <View className="modal-title">课程信息</View>
        <ScrollView scrollY style={{ maxHeight: "60vh", padding: "5px" }}>
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <DetailRow label="课程名称" value={course.name} />
            <DetailRow label="教师" value={course.teacher} />
            <DetailRow label="教室" value={course.room} />
            <DetailRow label="课程性质" value={course.kcxz} />
            <DetailRow label="学分" value={course.xf} />
            <DetailRow label="教学班组成" value={course.jxbzc} />
            <DetailRow label="周次" value={course.weeks} />
            <DetailRow label="节次" value={course.periods} />
            <DetailRow
              label="星期"
              value={`星期${course.weekDay}`}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
