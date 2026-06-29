import { View } from "@tarojs/components";

export default function UserCard({ text }) {
  return (
    <View className="bora"
      style={{
        backgroundColor: "#47a5fd",
		fontSize: "28rpx",
        color: "white",
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0px 20px",
      }}
    >
      {text}
    </View>
  );
}
