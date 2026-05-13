// TimeSlot.jsx
import { View } from "@tarojs/components";

export default function TimeSlot({ startTime, endTime, order, style = {} }) {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%", // 占满父容器高度
        ...style,
      }}
    >
      <View style={{ color: "#999", fontSize: "12px", lineHeight: 1.4 }}>
        {startTime}
      </View>
      <View
        style={{
          color: "#000",
          fontWeight: "bold",
          fontSize: "16px",
          margin: "4px 0",
        }}
      >
        {order}
      </View>
      <View style={{ color: "#999", fontSize: "12px", lineHeight: 1.4 }}>
        {endTime}
      </View>
    </View>
  );
}
