import { useState } from "react";
import MuYu from "../../../components/feature/MuYu";
import "./index.css";
import HeadStatus from "../../../components/layout/HeadStatus";
import SafeAreaView from "../../../components/base/SafeAreaView";
import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import { AtIcon } from "taro-ui";

export default function Index() {
	const [merits, setMerits] = useState(0);

	return (
		<SafeAreaView>
			<View className="uniform-page-header">
				<AtIcon
					value="arrow-left"
					color="#ffffff"
					onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
				/>
				<HeadStatus text="电子木鱼" />
			</View>
			<View className="muyu-page-content">
				<MuYu merit={merits} onMerit={() => setMerits((m) => m + 1)} />
			</View>
		</SafeAreaView>
	);
}
