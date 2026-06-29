import { useState, useCallback } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import SafeAreaView from "../../../components/base/SafeAreaView";
import HeadStatus from "../../../components/layout/HeadStatus";
import { AtIcon } from "taro-ui";
import runtimeLogger, { RUNTIME_LOGS_CACHE_KEY } from "../../../utils/common/runtimeLogger";
import "./index.css";

export default function Index() {
	const [logs, setLogs] = useState([]);

	const refreshLogs = useCallback(() => {
		setLogs(runtimeLogger.getLogs());
	}, []);

	useDidShow(() => {
		refreshLogs();
	});

	const handleCopy = async () => {
		const text = runtimeLogger.getTextForCopy();
		if (!text) {
			Taro.showToast({ title: "暂无日志", icon: "none" });
			return;
		}
		try {
			await Taro.setClipboardData({ data: text });
			Taro.showToast({ title: "已复制", icon: "success" });
		} catch (err) {
			runtimeLogger.error("RuntimeLog", "复制失败", err);
			Taro.showToast({ title: "复制失败", icon: "none" });
		}
	};

	const handleClear = () => {
		Taro.showModal({
			title: "删除日志",
			content: "确定删除全部运行日志吗？",
			confirmText: "删除",
			confirmColor: "#e64340",
			success: (res) => {
				if (!res.confirm) return;
				Taro.removeStorageSync(RUNTIME_LOGS_CACHE_KEY);
				setLogs([]);
				Taro.showToast({ title: "已删除", icon: "success" });
			},
		});
	};

	return (
		<SafeAreaView>
			<View className="runtime-log-page">
				<View className="runtime-log-header">
					<AtIcon
						value="arrow-left"
						color="#ffffff"
						onClick={() => Taro.navigateBack()}
					/>
					<HeadStatus text="运行日志" />
				</View>
				<Text className="runtime-log-count">共 {logs.length} 条记录</Text>

				<ScrollView scrollY className="runtime-log-scroll bora" showScrollbar>
					<View className="runtime-log-content">
						{logs.length === 0 ? (
							<Text className="runtime-log-empty">暂无运行日志</Text>
						) : (
							logs.map((entry) => (
								<Text
									key={entry.id}
									className={`runtime-log-line runtime-log-line--${entry.level.toLowerCase()}`}
								>
									{runtimeLogger.formatEntry(entry)}
								</Text>
							))
						)}
					</View>
				</ScrollView>

				<View className="runtime-log-actions">
					<View className="runtime-log-btn bora runtime-log-btn--copy" onClick={handleCopy}>
						<Text>复制全部</Text>
					</View>
					<View
						className="runtime-log-btn bora runtime-log-btn--delete"
						onClick={handleClear}
					>
						<Text>删除全部</Text>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}
