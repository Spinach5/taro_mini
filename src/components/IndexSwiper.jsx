import { Swiper, SwiperItem, View, Image, Text } from "@tarojs/components";
import "./IndexSwiper.css";

const DEFAULT_BANNERS = [
	{ id: "default-1", label: "校园服务" },
];

/**
 * 首页轮播图
 * @param {{ bannerList?: string[], className?: string }} props
 */
export default function IndexSwiper({ bannerList, className = "" }) {
	const hasBanners = bannerList && bannerList.length > 0;
	const items = hasBanners
		? bannerList.map((url, idx) => ({ id: `banner-${idx}`, url }))
		: DEFAULT_BANNERS;

	return (
		<Swiper
			indicatorDots
			autoplay
			interval={3000}
			duration={500}
			circular
			className={`swiper-box bora ${className}`}
		>
			{items.map((item) => (
				<SwiperItem key={item.id}>
					{item.url ? (
						<Image
							src={item.url}
							mode="aspectFill"
							className="slide-image"
						/>
					) : (
						<View className="slide-image slide-placeholder">
							<Text className="slide-placeholder-text">{item.label}</Text>
						</View>
					)}
				</SwiperItem>
			))}
		</Swiper>
	);
}
