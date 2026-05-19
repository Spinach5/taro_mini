import {
    View,
    Swiper,
    SwiperItem,
    Image,
    Text,
    Navigator,
} from "@tarojs/components";
import Taro from '@tarojs/taro'
import "./index.css";
import SafeAreaView from "../../../components/safeView";
import HeadStatus from "../../../components/headStatus";
import InputBar from "../../../components/InputBar"
import CategoryFilter from "../../../components/CategoryFilter";

export default function Index() {
    return (<SafeAreaView >
        {/* 返回按钮 */}
        <View
            className="fa fa-arrow-left back-btn"
            onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
        ></View>
        {/* 标题 */}
        <HeadStatus text="社团" />
        {/* 搜索组件 */}
        <InputBar placeholder={"搜索社团"}></InputBar>
        {/* 分类选择器 */}
        <CategoryFilter
            allText={'全部'}
            categories={[{id:1,name:'text'}]}
            onChange={(category)=>{console.log(category)}}
        />
        {/* 卡片 */}
        <View>
            {/* <View class="item-name">{{item.name}}</View>
            <View class="content-row">
                <View class="label">社团简介:</View>
                <View class="value">{{item.introduction}}</View>
            </View>
            <View class="content-row">
                <View class="label">社团活动:</View>
                <View class="value">{{item.activities}}</View>
            </View> */}
        </View>
    </SafeAreaView>);
}
