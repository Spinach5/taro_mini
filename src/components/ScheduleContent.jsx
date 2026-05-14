import { View } from "@tarojs/components";

export default function ScheDuleContent({ children, className = "" }) {
  return (
    <View
      style={{
		display: "flex",
        width: "100%",
        height: "100%",  // 或 flex: 1（需父容器为 flex 列）
        overflowY: "auto",
      }}
      className={`time-container ${className}`}
    >
      {children}
    </View>
  );
}
