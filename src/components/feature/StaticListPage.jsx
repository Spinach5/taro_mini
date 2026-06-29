import { useState } from "react";
import { View, ScrollView, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import SafeAreaView from "../base/SafeAreaView";
import HeadStatus from "../layout/HeadStatus";
import InputBar from "./InputBar";
import { AtIcon } from "taro-ui";
import "./StaticListPage.css";

/**
 * 静态列表页（后端未接入时使用）
 */
export default function StaticListPage({
	title,
	groups = [],
	searchPlaceholder,
}) {
	const [searchWhat, setSearchWhat] = useState("");

	const matchItem = (item) => {
		if (!searchWhat) return true;
		const keyword = searchWhat.toLowerCase();
		if (item.name?.toLowerCase().includes(keyword)) return true;
		return (item.rows || []).some((row) =>
			`${row.label}${row.value}`.toLowerCase().includes(keyword),
		);
	};

	return (
		<SafeAreaView>
			<View className="uniform-page-header">
			<AtIcon
				value="arrow-left"
				color="#ffffff"
				onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
			/>
			<HeadStatus text={title} />
			</View>
			{searchPlaceholder && (
				<View className="static-list-header">
					<InputBar
						placeholder={searchPlaceholder}
						onInput={(input) => setSearchWhat(input)}
					/>
				</View>
			)}

			<ScrollView scrollY showScrollbar={false} enhanced bounces={false}>
				<View className="static-list-body">
					{groups.map((group) => {
						const visibleItems = (group.items || []).filter(matchItem);
						if (visibleItems.length === 0) return null;
						return (
							<View key={group.title} className="static-list-group bora">
								<View className="static-list-group-title">{group.title}</View>
								{visibleItems.map((item) => (
									<View key={item.name} className="static-list-item">
										<Text className="static-list-item-name">{item.name}</Text>
										{(item.rows || []).map((row) => (
											<View key={row.label} className="static-list-row">
												<Text className="static-list-label">{row.label}：</Text>
												<Text className="static-list-value">{row.value}</Text>
											</View>
										))}
									</View>
								))}
							</View>
						);
					})}
					{groups.every((g) =>
						(g.items || []).filter(matchItem).length === 0,
					) && (
						<View className="static-list-empty">暂无匹配内容</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
