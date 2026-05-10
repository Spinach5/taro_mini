import { useState } from "react";
import { Text, View, Image } from "@tarojs/components";
import { AtButton, AtIcon, AtFab, AtAvatar, AtBadge ,AtCurtain} from "taro-ui";
import SafeAreaView from "../../components/safeView";
import "./index.scss";
import Btn from "../../components/Btn";
import CourseHeader from "../../components/courseHeader";
import { getExtroInfo } from "../../service/hubt/ExtroInfo";
import { useDidShow, useLoad } from "@tarojs/taro";

export default function Index() {
	const [isOpened, setIsOpened] = useState(false);

	const handleChange = () => {
		setIsOpened(true);
	};

	const onClose = () => {
		setIsOpened(false);
	};
	useDidShow(async () => {
		console.log("页面加载完成");
		console.log(await getExtroInfo());
	});

	return (
		<SafeAreaView>
			{/* 工具栏 */}
			<CourseHeader />
			<AtButton loading type="primary">
				按钮文案
			</AtButton>
			<AtIcon value="clock" size="30" color="#F00"></AtIcon>
			<AtFab>
				<Text className="at-fab__icon at-icon at-icon-menu"></Text>
			</AtFab>
			<AtAvatar image="https://imgs.699pic.com/images/500/705/999.jpg!seo.v1"></AtAvatar>
			<AtAvatar text="ysx"></AtAvatar>
			<AtAvatar
				circle
				image="https://imgs.699pic.com/images/500/705/999.jpg!seo.v1"
			></AtAvatar>
			<AtAvatar circle text="ysx"></AtAvatar>
			<View className="at-article">
				<View className="at-article__h1">这是一级标题这是一级标题</View>
				<View className="at-article__info">
					2017-05-07&nbsp;&nbsp;&nbsp;这是作者
				</View>
				<View className="at-article__content">
					<View className="at-article__section">
						<View className="at-article__h2">这是二级标题</View>
						<View className="at-article__h3">这是三级标题</View>
						<View className="at-article__p">
							这是文本段落。这是文本段落。这是文本段落。这是文本段落。这是文本段落。这是文本段落。这是文本段落。这是文本落。这是文本段落。1234567890123456789012345678901234567890
							ABCDEFGHIJKLMNOPQRSTUVWXYZ
						</View>
						<View className="at-article__p">
							这是文本段落。这是文本段落。
						</View>
						<Image
							className="at-article__img"
							src="https://imgs.699pic.com/images/500/705/999.jpg!seo.v1"
							mode="widthFix"
						/>
					</View>
				</View>
			</View>
			<AtBadge dot>
				<AtButton size="small">按钮</AtButton>
			</AtBadge>
			<AtBadge value="NEW">
				<AtButton size="small">按钮</AtButton>
			</AtBadge>
			<AtBadge value="杨士雄">
				<AtButton size="small">按钮</AtButton>
			</AtBadge>
			<View>
				<AtCurtain isOpened={isOpened} onClose={onClose}>
					<Image style="width:50%;height:50%;" src="https://sucai.602.com/material/aggregatePage/1754546685738.gif" />
				</AtCurtain>
				<AtButton onClick={handleChange}>右上关闭幕帘</AtButton>
			</View>
		</SafeAreaView>
	);
}
