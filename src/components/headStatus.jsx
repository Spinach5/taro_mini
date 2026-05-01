import { View } from "@tarojs/components";

export default function HeadStatus({
  children,
  className = ''
}) {
  return (
    <View
      className={`head-status ${className}`}
      style={{
        color: "#fff", // 直接设置颜色
        fontWeight: "bold",
        display: "flex",
        flexDirection: "row",
      }}
    >
      {children}
    </View>
  );
}

