import { View, Text, Input, Textarea, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState } from "react";
import { AtIcon } from "taro-ui";
import SafeAreaView from "../../../../components/SafeAreaView";
import HeadStatus from "../../../../components/HeadStatus";
import userManager from "../../../../service/userInfo";
import { serverPost } from "../../../../utils/serverRequest";
import cacheManager from "../../../../utils/cache";
import runtimeLogger from "../../../../utils/runtimeLogger";
import "./index.css";

const ALL_CATEGORIES = [
	"学术科技类",
	"创新创业类",
	"文化艺术类",
	"体育活动类",
	"志愿公益类",
	"思想政治类",
	"其他",
];

const NATURE_OPTIONS = [
	{ label: "社团", value: 0 },
	{ label: "学生会", value: 1 },
	{ label: "其他", value: 2 },
];

export default function Index() {
	const [name, setName] = useState("");
	const [category, setCategory] = useState(ALL_CATEGORIES[0]);
	const [nature, setNature] = useState(0);
	const [introduction, setIntroduction] = useState("");
	const [activities, setActivities] = useState("");
	const [contact, setContact] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [showCatPicker, setShowCatPicker] = useState(false);
	const [showNaturePicker, setShowNaturePicker] = useState(false);

	const handleSubmit = async () => {
		if (!name.trim()) {
			Taro.showToast({ title: "请输入社团名称", icon: "none" });
			return;
		}

		setSubmitting(true);
		try {
			const schoolId = userManager.getSchoolId() || "hbut";
			const res = await serverPost("/api/v1/clubs", {
				name: name.trim(),
				category,
				nature,
				introduction: introduction.trim() || null,
				activities: activities.trim() || null,
				contact: contact.trim() || null,
				schoolId,
			});

			if (res && res.success) {
				cacheManager.remove("v1_clubs"); // 清除缓存，下次刷新
				Taro.showToast({ title: "创建成功", icon: "success" });
				setTimeout(() => Taro.navigateBack(), 1500);
			} else {
				Taro.showToast({
					title: (res && res.message) || "创建失败",
					icon: "none",
				});
			}
		} catch (error) {
			runtimeLogger.error("ClubAdd", "创建社团失败", error);
			Taro.showToast({
				title: error.message || "创建失败，请稍后重试",
				icon: "none",
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<SafeAreaView>
			<View className="uniform-page-header">
				<AtIcon value="arrow-left" color="#ffffff" onClick={() => Taro.navigateBack()} />
				<HeadStatus text="添加社团" />
			</View>

			<ScrollView scrollY className="form-scroll" enhanced bounces={false}>
				{/* 社团名称 */}
				<View className="form-group">
					<Text className="form-label">社团名称 *</Text>
					<Input
						className="form-input"
						placeholder="请输入社团名称"
						value={name}
						onInput={(e) => setName(e.detail.value)}
						maxlength={50}
					/>
				</View>

				{/* 种类 */}
				<View className="form-group">
					<Text className="form-label">种类 *</Text>
					<View className="form-picker" onClick={() => setShowCatPicker(!showCatPicker)}>
						<Text className="picker-value">{category}</Text>
						<AtIcon value={showCatPicker ? "chevron-up" : "chevron-down"} size={16} color="#999" />
					</View>
					{showCatPicker && (
						<View className="picker-options">
							{ALL_CATEGORIES.map((cat) => (
								<View
									key={cat}
									className={`picker-option ${category === cat ? "picker-option-active" : ""}`}
									onClick={() => {
										setCategory(cat);
										setShowCatPicker(false);
									}}
								>
									<Text>{cat}</Text>
								</View>
							))}
						</View>
					)}
				</View>

				{/* 性质 */}
				<View className="form-group">
					<Text className="form-label">性质 *</Text>
					<View className="form-picker" onClick={() => setShowNaturePicker(!showNaturePicker)}>
						<Text className="picker-value">{NATURE_OPTIONS.find((n) => n.value === nature)?.label}</Text>
						<AtIcon value={showNaturePicker ? "chevron-up" : "chevron-down"} size={16} color="#999" />
					</View>
					{showNaturePicker && (
						<View className="picker-options">
							{NATURE_OPTIONS.map((opt) => (
								<View
									key={opt.value}
									className={`picker-option ${nature === opt.value ? "picker-option-active" : ""}`}
									onClick={() => {
										setNature(opt.value);
										setShowNaturePicker(false);
									}}
								>
									<Text>{opt.label}</Text>
								</View>
							))}
						</View>
					)}
				</View>

				{/* 简介 */}
				<View className="form-group">
					<Text className="form-label">简介</Text>
					<Textarea
						className="form-textarea"
						placeholder="请输入社团简介"
						value={introduction}
						onInput={(e) => setIntroduction(e.detail.value)}
						maxlength={500}
						autoHeight
					/>
				</View>

				{/* 活动 */}
				<View className="form-group">
					<Text className="form-label">活动</Text>
					<Textarea
						className="form-textarea"
						placeholder="请输入社团活动（每行一个）"
						value={activities}
						onInput={(e) => setActivities(e.detail.value)}
						maxlength={1000}
						autoHeight
					/>
				</View>

				{/* 联系方式 */}
				<View className="form-group">
					<Text className="form-label">联系方式</Text>
					<Input
						className="form-input"
						placeholder="请输入联系方式（选填）"
						value={contact}
						onInput={(e) => setContact(e.detail.value)}
						maxlength={100}
					/>
				</View>

				{/* 提交按钮 */}
				<View className="submit-btn" onClick={submitting ? undefined : handleSubmit}>
					<Text className="submit-text">{submitting ? "提交中..." : "提交"}</Text>
				</View>

				<View style={{ height: "60rpx" }} />
			</ScrollView>
		</SafeAreaView>
	);
}
