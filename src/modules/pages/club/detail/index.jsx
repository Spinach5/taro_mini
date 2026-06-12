import { View, Text } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import { useState } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import SafeAreaView from "../../../../components/SafeAreaView";
import HeadStatus from "../../../../components/HeadStatus";
import { getClubDetail } from "../../../../service";
import runtimeLogger from "../../../../utils/runtimeLogger";
import "./index.css";

const NATURE_MAP = ["社团", "学生会", "其他"];

function parseActivities(activities) {
	if (!activities) return [];
	if (typeof activities === "string") {
		try {
			const parsed = JSON.parse(activities);
			return Array.isArray(parsed) ? parsed : [activities];
		} catch {
			return [activities];
		}
	}
	if (Array.isArray(activities)) return activities;
	return [];
}

export default function Index() {
	const router = Taro.useRouter();
	const { id } = router.params;

	const [club, setClub] = useState(null);
	const [loading, setLoading] = useState(true);

	useLoad(() => {
		if (!id) {
			Taro.showToast({ title: "无效的社团ID", icon: "none" });
			Taro.navigateBack();
			return;
		}

		(async () => {
			try {
			const data = await getClubDetail(id);
			if (data) {
			setClub(data);
				} else {
					Taro.showToast({ title: "社团不存在", icon: "none" });
					Taro.navigateBack();
				}
			} catch (error) {
				runtimeLogger.error("ClubDetail", "获取社团详情失败", error);
				Taro.showToast({ title: "加载失败", icon: "none" });
			} finally {
				setLoading(false);
			}
		})();
	});

	if (loading) {
		return (
			<SafeAreaView>
				<View className="uniform-page-header">
					<AtIcon value="arrow-left" color="#ffffff" onClick={() => Taro.navigateBack()} />
					<HeadStatus text="社团详情" />
				</View>
				<View className="loading-view">
					<AtActivityIndicator isOpened size={32} mode="center" />
				</View>
			</SafeAreaView>
		);
	}

	if (!club) {
		return (
			<SafeAreaView>
				<View className="uniform-page-header">
					<AtIcon value="arrow-left" color="#ffffff" onClick={() => Taro.navigateBack()} />
					<HeadStatus text="社团详情" />
				</View>
				<View className="empty-view">
					<Text>社团数据为空</Text>
				</View>
			</SafeAreaView>
		);
	}

	const activities = parseActivities(club.activities);

	return (
		<SafeAreaView>
			<View className="uniform-page-header">
				<AtIcon value="arrow-left" color="#ffffff" onClick={() => Taro.navigateBack()} />
				<HeadStatus text="社团详情" />
			</View>

			<View className="detail-scroll">
				{/* 图片占位 */}
				<View className="detail-banner">
					<Text className="detail-banner-text">社团图片暂缺</Text>
				</View>

				{/* 基本信息 */}
				<View className="detail-section">
					<Text className="detail-name">{club.name}</Text>
					<View className="detail-meta">
						<Text className="detail-meta-item">学校：{club.schoolId}</Text>
						<Text className="detail-meta-item">性质：{NATURE_MAP[club.nature] || "社团"}</Text>
						<Text className="detail-meta-item">类型：{club.category || "未分类"}</Text>
					</View>
				</View>

				{/* 介绍 */}
				<View className="detail-section">
					<Text className="detail-section-title">介绍</Text>
					<Text className="detail-section-content">
						{club.introduction || "暂无介绍"}
					</Text>
				</View>

				{/* 活动 */}
				<View className="detail-section">
					<Text className="detail-section-title">活动</Text>
					{activities.length > 0 ? (
						activities.map((act, idx) => (
							<View key={idx} className="activity-item">
								<Text className="activity-dot">•</Text>
								<Text className="activity-text">
									{typeof act === "string" ? act : act.title || act.name || JSON.stringify(act)}
								</Text>
							</View>
						))
					) : (
						<Text className="detail-section-content">暂无活动</Text>
					)}
				</View>

				{/* 负责人 & 联系方式 */}
				<View className="detail-section">
					<View className="detail-row">
						<Text className="detail-label">负责人：</Text>
						<Text className="detail-value">{club.principal_name || "未知"}</Text>
					</View>
					<View className="detail-row">
						<Text className="detail-label">联系方式：</Text>
						<Text className="detail-value">{club.contact || "无"}</Text>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}
