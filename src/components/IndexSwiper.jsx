import { Swiper, SwiperItem, View, Text } from "@tarojs/components";
import "./IndexSwiper.css";

const bannerList = [{ id: 1 }];

export default function IndexSwiper({ className = "" }) {
	return (
		<Swiper
			indicatorDots
			autoplay
			interval={3000}
			duration={500}
			circular
			className={`swiper-box bora ${className}`}
		>
			{bannerList.map((item) => (
				<SwiperItem key={item.id}>
					<View className="slide-image slide-placeholder">
						<Text className="slide-placeholder-text">校园服务</Text>
					</View>
				</SwiperItem>
			))}
		</Swiper>
	);
}
