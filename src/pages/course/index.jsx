// pages/course/index.jsx
import { useState, useEffect } from "react";
import { View, Swiper, SwiperItem } from "@tarojs/components";
import Taro from '@tarojs/taro';
import SafeAreaView from "../../components/safeView";
import CourseHeader from "../../components/courseHeader";
import WeekHeader from "../../components/courseWeek";
import CourseTable from "../../components/courseTable";
import { getCurrentWeek } from "../../service/hubt/CurrentWeek";
import { getAllWeek } from "../../service/hubt/GetAllWeek";
import "./index.css";

export default function Index() {
  const [currentWeek, setCurrentWeek] = useState(null);
  const [weekList, setWeekList] = useState([]);      // 例如 [1,2,3,...20]
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    Promise.all([getCurrentWeek(), getAllWeek()])
      .then(([week, weeks]) => {
        setWeekList(weeks);
        setCurrentWeek(week);
        // 找到当前周在 weekList 中的索引
        const idx = weeks.indexOf(week);
        setCurrentIndex(idx >= 0 ? idx : 0);
      })
      .catch(err => console.error(err));
  }, []);

  const handleWeekChange = (week) => {
    setCurrentWeek(week);
  };

  const onSwiperChange = (e) => {
    const newIndex = e.detail.current;
    const newWeek = weekList[newIndex];
    if (newWeek && newWeek !== currentWeek) {
      setCurrentIndex(newIndex);
      setCurrentWeek(newWeek);
    }
  };

  if (currentWeek === null || weekList.length === 0) {
    return <View>加载中...</View>;
  }

  return (
    <SafeAreaView>
      <CourseHeader currentWeek={currentWeek} onWeekChange={handleWeekChange} />
      <WeekHeader currentWeek={currentWeek} />
      <Swiper
        className="swiper-container"
        current={currentIndex}
        onChange={onSwiperChange}
        circular={false}      // 不循环
        autoplay={false}      // 不自动切换
        indicatorDots={false} // 不显示圆点
        style={{ flex: 1, width: '100%' }}
      >
        {weekList.map((week) => (
          <SwiperItem key={week} style={{ height: '100%' }}>
            <CourseTable currentWeek={week} />
          </SwiperItem>
        ))}
      </Swiper>
    </SafeAreaView>
  );
}
