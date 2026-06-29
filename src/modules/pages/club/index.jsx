import { View, Text, ScrollView, Swiper, SwiperItem, Input } from "@tarojs/components";
import Taro, { useLoad, useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { useState, useCallback } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import SafeAreaView from "../../../components/base/SafeAreaView";
import HeadStatus from "../../../components/layout/HeadStatus";
import userManager from "../../../service/userInfo";
import { getAllClub } from "../../../service";
import { getColorFromName } from "../../../utils/common/getHashCode";
import runtimeLogger from "../../../utils/common/runtimeLogger";
import "./index.css";

const NATURE_MAP = ["社团", "学生会", "其他"];

export default function Index() {
	const [authState, setAuthState] = useState(null); // null=loading, "login"=need login, "register"=need register, "ok"=passed
	const [clubs, setClubs] = useState([]);
	const [categories, setCategories] = useState(["全部"]);
	const [activeCategory, setActiveCategory] = useState("全部");
	const [loading, setLoading] = useState(true);

	const checkAuth = useCallback(() => {
		if (!userManager.checkLogin()) {
			setAuthState("login");
			return false;
		}
		if (!userManager.getServerToken()) {
			setAuthState("register");
			return false;
		}
		setAuthState("ok");
		return true;
	}, []);

	const fetchClubs = useCallback(async (forceRefresh = false) => {
		try {
			const { clubs: data, categories: cats } = await getAllClub(forceRefresh);
			setClubs(data);
			setCategories(cats);
		} catch (error) {
			runtimeLogger.error("Club", "获取社团列表失败", error);
			Taro.showToast({ title: "加载失败，请下拉刷新", icon: "none" });
		} finally {
			setLoading(false);
		}
	}, []);

	useLoad(() => {
		if (checkAuth()) fetchClubs();
	});

	useDidShow(() => {
		if (checkAuth()) fetchClubs(true);
	});

	usePullDownRefresh(() => {
		if (authState === "ok") {
			fetchClubs(true).finally(() => Taro.stopPullDownRefresh());
		} else {
			Taro.stopPullDownRefresh();
		}
	});

	const filteredClubs =
		activeCategory === "全部"
			? clubs
			: clubs.filter((c) => c.category === activeCategory);

	const handleCardClick = (id) => {
		Taro.navigateTo({ url: `/modules/pages/club/detail/index?id=${id}` });
	};

	// 鉴权未通过
	if (authState === "login") {
		return (
			<SafeAreaView>
				<View className="uniform-page-header">
					<AtIcon value="arrow-left" color="#ffffff" onClick={() => Taro.switchTab({ url: "/pages/index/index" })} />
					<HeadStatus text="社团" />
				</View>
				<View className="notLoginView">
					<Text className="notLoginText">请先登录</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (authState === "register") {
		return (
			<SafeAreaView>
				<View className="uniform-page-header">
					<AtIcon value="arrow-left" color="#ffffff" onClick={() => Taro.switchTab({ url: "/pages/index/index" })} />
					<HeadStatus text="社团" />
				</View>
				<View className="notLoginView">
					<Text className="notLoginText">请先在设置中注册拓展功能</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView>
			<View className="uniform-page-header">
				<AtIcon value="arrow-left" color="#ffffff" onClick={() => Taro.switchTab({ url: "/pages/index/index" })} />
				<HeadStatus text="社团" />
			</View>

			{/* 轮播图占位 */}
			<View className="club-banner">
				<Swiper indicatorDots autoplay circular style={{ height: "100%" }}>
					<SwiperItem>
						<View className="banner-placeholder">
							<Text className="banner-text">轮播图区域</Text>
						</View>
					</SwiperItem>
					<SwiperItem>
						<View className="banner-placeholder">
							<Text className="banner-text">更多内容即将上线</Text>
						</View>
					</SwiperItem>
				</Swiper>
			</View>

			{/* 种类筛选 */}
			<ScrollView scrollX showScrollbar={false} className="category-scroll" enhanced>
				<View className="category-list">
					{categories.map((cat) => (
						<View
							key={cat}
							className={`category-tag ${activeCategory === cat ? "category-tag-active" : ""}`}
							onClick={() => setActiveCategory(cat)}
						>
							<Text>{cat}</Text>
						</View>
					))}
				</View>
			</ScrollView>

			{/* 社团列表 */}
			{loading ? (
				<View className="loading-view">
					<AtActivityIndicator isOpened size={32} mode="center" />
					<Text className="loading-text">加载社团数据中...</Text>
				</View>
			) : (
				<ScrollView scrollY showScrollbar={false} className="club-list" enhanced bounces={false}>
					{filteredClubs.length > 0 ? (
						filteredClubs.map((club) => (
							<View key={club.id} className="club-card" onClick={() => handleCardClick(club.id)}>
								<View className="card-avatar" style={{ backgroundColor: getColorFromName(club.name) }}>
									{club.image_url ? (
										<View className="avatar-img" style={{ backgroundImage: `url(${club.image_url})` }} />
									) : (
										<Text className="avatar-text">{club.name.charAt(0)}</Text>
									)}
								</View>
								<View className="card-info">
									<Text className="card-name">{club.name}</Text>
									<View className="card-meta">
										<Text className="meta-tag">{club.category || "未分类"}</Text>
										<Text className="meta-dot">|</Text>
										<Text className="meta-tag">{NATURE_MAP[club.nature] || "社团"}</Text>
										<Text className="meta-dot">|</Text>
										<Text className="meta-tag">{club.schoolId}</Text>
									</View>
								</View>
								<AtIcon value="chevron-right" size={14} color="#ccc" />
							</View>
						))
					) : (
						<View className="empty-view">
							<Text className="empty-text">暂无社团数据</Text>
						</View>
					)}
				</ScrollView>
			)}

			{/* 添加社团 FAB */}
			<View className="fab-btn" onClick={() => Taro.navigateTo({ url: "/modules/pages/club/add/index" })}>
				<Text className="fab-text">+</Text>
			</View>
		</SafeAreaView>
	);
}
