import { useState } from "react";
import MuYu from "../../../components/feature/MuYu";
import "./index.css";
import PageHeader from "../../../components/business/PageHeader";
import SafeAreaView from "../../../components/base/SafeAreaView";
import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";

export default function Index() {
	const [merits, setMerits] = useState(0);

	return (
		<SafeAreaView>
			<PageHeader
				title="电子木鱼"
				onBack={() => Taro.switchTab({ url: "/pages/index/index" })}
			/>
			<View className="muyu-page-content">
				<MuYu merit={merits} onMerit={() => setMerits((m) => m + 1)} />
			</View>
		</SafeAreaView>
	);
}
