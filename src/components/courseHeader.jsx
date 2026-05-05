import { View, Image, Text } from "@tarojs/components";
import Btn from "./Btn";

export default function CourseHeader({ className = "" }) {
	return (
		<View
			className={`${className}`}
			style={{
				padding: "4px",
				marginBottom: "16px",
				height: "40px",
				display: "flex",
				gap: "8px",
			}}
		>
			<Btn>
				<Image src="../assets/more.svg" />
			</Btn>
			<Btn>
				<Text>第1周</Text>
				<Image src="../assets/down.svg" />
			</Btn>
		</View>
	);
}
