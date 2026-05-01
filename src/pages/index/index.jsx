import { View, Swiper, SwiperItem, Image, Text } from '@tarojs/components'
import defaultPic from '../../assets/tower.jpeg'
import img1 from '../../assets/p1.jpg'
import img2 from '../../assets/p2.jpg'
import img3 from '../../assets/p3.jpg'
import './index.scss'
import SafeAreaView from "../../components/safeView"
import HeadStatus from '../../components/headStatus'
import GridItem  from '../../components/gridItem'
import Taro from '@tarojs/taro'

// 顶部导入所有图标
import studentIcon from '../../assets/8个功能/Workgroup.png';
import clubIcon from '../../assets/8个功能/社团.png';
import foodIcon from '../../assets/8个功能/餐饮.png';
import adminIcon from '../../assets/8个功能/行政地标.png';
import bookIcon from '../../assets/8个功能/手绘书本.png';
import dailyIcon from '../../assets/8个功能/日常用品.png';
import mapIcon from '../../assets/8个功能/世界地图.png';
import secondHandIcon from '../../assets/8个功能/书本.png';

export default function Index() {
  const bannerList = [
    { id: 1, imageUrl: defaultPic },
    { id: 2, imageUrl: img1 },
    { id: 3, imageUrl: img2 },
    { id: 4, imageUrl: img3 },
  ]
  return (
    <SafeAreaView className=''>
		<HeadStatus >首页</HeadStatus>
      <Swiper
        indicatorDots
        autoplay
        interval={3000}
        duration={500}
        circular
        className="swiper-box"
      >
        {bannerList.map((item) => (
          <SwiperItem key={item.id}>
            <Image className="slide-image" src={item.imageUrl} mode="widthFix" />
          </SwiperItem>
        ))}
      </Swiper>

      <View className="grid-container">
		<GridItem
		url="/pages/student-union/index"
          icon={studentIcon}
          text="学生会"
		/>
		<GridItem
		url="/pages/club/index"
          icon={clubIcon}
          text="社团"
		/>
		<GridItem
		url="/pages/food/index"
          icon={foodIcon}
          text="美食"
		/>
		<GridItem
		url="/pages/admin/index"
          icon={adminIcon}
          text="行政事务"
		/>

		<GridItem
		url="/pages/books/index"
          icon={bookIcon}
          text="书籍资料"
		/>

		<GridItem
		url="/pages/daily-goods/index"
          icon={dailyIcon}
          text="日常用品"
		/>
		<GridItem
		url="/pages/map/index"
          icon={mapIcon}
          text="地图"
		/>
		<GridItem
		url="/pages/secondhand-book/index"
          icon={secondHandIcon}
          text="二手书"
		/>
      <View className='bora card list'>
        <View className='item'>最终可能展示公告或活动</View>
      </View>
	  </View>
    </SafeAreaView>
  )
}
