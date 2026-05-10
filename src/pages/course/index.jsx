import { useState } from "react";
import {
	View,
	Swiper,
	SwiperItem,
	Image,
	Text,
	Navigator,
	ScrollView,
} from "@tarojs/components";
import SafeAreaView from "../../components/safeView";
import "./index.scss";
import Btn from "../../components/Btn";
import CourseHeader from "../../components/courseHeader";
import { getExtroInfo } from "../../service/hubt/ExtroInfo";
import { useDidShow, useLoad } from "@tarojs/taro";

export default function Index() {
	useDidShow(async () => {
		console.log("页面加载完成");
		console.log(await getExtroInfo());
	});

	return (
		<SafeAreaView>
			{/* 工具栏 */}
			<CourseHeader />


		</SafeAreaView>
	);
}
