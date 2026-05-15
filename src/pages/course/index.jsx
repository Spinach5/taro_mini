// pages/course/index.jsx
import { useState, useEffect } from "react";
import { View, Swiper, SwiperItem, ScrollView } from "@tarojs/components";
import SafeAreaView from "../../components/safeView";
import CourseHeader from "../../components/courseHeader";
import WeekHeader from "../../components/courseWeek";
import TimeColumn from "../../components/courseTimeColumn";
import CourseGrid from "../../components/courseGrid";
import { getCurrentWeek } from "../../service/hubt/CurrentWeek";
import { getAllWeek } from "../../service/hubt/GetAllWeek";
import { getAllSchedule } from "../../service/hubt/AllSchedule";
import { getTimeTable } from "../../service/hubt/GetTimeTable";
import { getColorFromName } from "../../utils/getHashCode";
import "./index.css";

export default function Index() {
  const [currentWeek, setCurrentWeek] = useState(null);
  const [weekList, setWeekList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeTable, setTimeTable] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weeksData, setWeeksData] = useState({});

  // 获取周次
  useEffect(() => {
    Promise.all([getCurrentWeek(), getAllWeek()])
      .then(([week, weeks]) => {
        setWeekList(weeks);
        setCurrentWeek(week);
        const idx = weeks.indexOf(week);
        setCurrentIndex(idx >= 0 ? idx : 0);
      })
      .catch(err => console.error(err));
  }, []);

  // 获取基础数据
  useEffect(() => {
    Promise.all([
      getAllSchedule("2025-2026-2"),
      getTimeTable("2025-2026-2"),
    ])
      .then(([scheduleData, timeData]) => {
        setCourses(scheduleData);
        setTimeTable(timeData);
        setLoading(false);
      })
      .catch(err => {
        console.error("获取课表失败", err);
        setLoading(false);
      });
  }, []);

  // 预处理所有周的课程网格数据
  useEffect(() => {
    if (loading || weekList.length === 0 || timeTable.length === 0 || courses.length === 0) return;

    const periodIndexMap = {};
    timeTable.forEach((item, idx) => {
      periodIndexMap[parseInt(item.jc)] = idx;
    });

    const newData = {};
    weekList.forEach(week => {
      const weekCourses = courses.filter(course =>
        course.zcstr?.some(w => parseInt(w) === parseInt(week))
      );
      const gridItems = weekCourses
        .map((course, idx) => {
          const weekDay = parseInt(course.xingqi);
          const colIndex = weekDay - 1;
          const periods = course.djc.map(p => parseInt(p));
          if (!periods.length) return null;
          const startPeriod = Math.min(...periods);
          const endPeriod = Math.max(...periods);
          const startRow = periodIndexMap[startPeriod];
          const endRow = periodIndexMap[endPeriod];
          if (startRow === undefined || endRow === undefined) return null;
          const rowSpan = endRow - startRow + 1;
          return {
            id: `${course.kcmc}_${course.xingqi}_${startPeriod}_${idx}`,
            name: course.kcmc,
            room: course.croommc,
            teacher: course.tmc,
            col: colIndex,
            row: startRow,
            rowSpan: rowSpan,
            color: getColorFromName(course.kcmc),
            kcxz: course.kcxz || "未知",
            xf: course.xf || "未知",
            jxbzc: course.jxbzc || "未知",
            weeks: course.zcstr ? course.zcstr.join(",") : "未知",
            periods: course.djc.join(","),
            weekDay: course.xingqi,
          };
        })
        .filter(item => item !== null);
      newData[week] = gridItems;
    });
    setWeeksData(newData);
  }, [loading, weekList, timeTable, courses]);

  const handleWeekChange = (week) => {
    const idx = weekList.indexOf(week);
    if (idx !== -1) {
      setCurrentIndex(idx);
      setCurrentWeek(week);
    }
  };

  const onSwiperChange = (e) => {
    const idx = e.detail.current;
    const week = weekList[idx];
    if (week && week !== currentWeek) {
      setCurrentIndex(idx);
      setCurrentWeek(week);
    }
  };

  if (loading || !currentWeek || weekList.length === 0 || timeTable.length === 0) {
    return <View>加载中...</View>;
  }

  return (
    <SafeAreaView>
      <CourseHeader currentWeek={currentWeek} onWeekChange={handleWeekChange} />
      <WeekHeader currentWeek={currentWeek} />

      {/* 外层垂直滚动容器，使时间列和课表同步滚动 */}
      <ScrollView scrollY className="outer-scroll">
        <View className="schedule-row">
          {/* 左侧固定时间列 */}
          <View className="time-col-fixed">
            <TimeColumn timeTable={timeTable} />
          </View>

          {/* 右侧可水平滑动的 Swiper */}
          <View className="swiper-col">
            <Swiper
              current={currentIndex}
              onChange={onSwiperChange}
              className="week-swiper"
            >
              {weekList.map(week => (
                <SwiperItem key={week}>
                  <CourseGrid
                    gridCourses={weeksData[week] || []}
                    rowCount={timeTable.length}
                  />
                </SwiperItem>
              ))}
            </Swiper>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
