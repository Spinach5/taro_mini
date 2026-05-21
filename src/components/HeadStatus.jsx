import { View, Text } from "@tarojs/components";
import "./HeadStatus.css";

export default function HeadStatus({ children, className = "", text = "" }) {
	return (
		<View className={`head-status ${className}`}>
			<Text className="head-status-text">{text}</Text>
			{children}
		</View>
	);
}
