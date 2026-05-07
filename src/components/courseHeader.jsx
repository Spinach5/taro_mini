import { View, Image, Text } from "@tarojs/components";
import Btn from "./Btn";
import more from "../assets/more.svg";
import down from "../assets/down.svg";

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
				<Image src={more} />
			</Btn>
			<Btn>
				<Text>第1周</Text>
				<Image src={down} />
			</Btn>
		</View>
	);
}
