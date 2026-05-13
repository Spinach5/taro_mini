import { View, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import "./courseWeek.scss";
import { getCurrentWeek } from "../service/hubt/CurrentWeek"; // 获取实际周数的接口

/**
 * 根据基准周一日期和目标周数偏移计算目标周一的日期
 * @param {Date} baseMonday 基准周一（今天的周一）
 * @param {number} diffWeeks 目标周数 - 实际周数
 * @returns {Date}
 */
const getTargetMonday = (baseMonday, diffWeeks) => {
  const target = new Date(baseMonday);
  target.setDate(baseMonday.getDate() + diffWeeks * 7);
  return target;
};

/**
 * 根据周一的日期，生成一周的日期数组
 * @param {Date} mondayDate 周一日期
 * @returns {Array<{ date: number, month: number, weekStr: string, fullDate: Date }>}
 */
const getWeekDatesFromMonday = (mondayDate) => {
  const weekDays = [];
  const weekStrMap = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  for (let i = 0; i < 7; i++) {
    const day = new Date(mondayDate);
    day.setDate(mondayDate.getDate() + i);
    weekDays.push({
      date: day.getDate(),
      month: day.getMonth() + 1,
      weekStr: weekStrMap[i],
      fullDate: day,
    });
  }
  return weekDays;
};

export default function WeekHeader({ currentWeek, className = "" }) {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [weekDates, setWeekDates] = useState([]);
  const [todayDate, setTodayDate] = useState(null);
  const [actualWeek, setActualWeek] = useState(null); // 今天的实际周数

  // 获取今天的实际周数和日期
  useEffect(() => {
    getCurrentWeek().then((week) => setActualWeek(week));
    setTodayDate(new Date());
  }, []);

  // 当 actualWeek 或 currentWeek 变化时，重新计算显示的日期
  useEffect(() => {
    if (actualWeek === null || currentWeek === undefined) return;

    // 1. 计算今天的周一日期
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0:周日, 1:周一, ..., 6:周六
    const daysToMonday = (dayOfWeek + 6) % 7; // 到周一的天数
    const actualMonday = new Date(today);
    actualMonday.setDate(today.getDate() - daysToMonday);

    // 2. 周数差值
    const diff = currentWeek - actualWeek;
    const targetMonday = getTargetMonday(actualMonday, diff);

    // 3. 生成一周日期
    const weekData = getWeekDatesFromMonday(targetMonday);
    setWeekDates(weekData);

    // 4. 更新月份框（显示该周周一的月份）
    setCurrentMonth(targetMonday.getMonth() + 1);
  }, [currentWeek, actualWeek]);

  // 判断是否为今天（仅在显示的日期中包含今天的日期时才显示高亮）
  const isToday = (dateItem) => {
    if (!todayDate) return false;
    return (
      dateItem.date === todayDate.getDate() &&
      dateItem.month === todayDate.getMonth() + 1 &&
      dateItem.fullDate.getFullYear() === todayDate.getFullYear()
    );
  };

  return (
    <View className={`week-header ${className}`}>
      {/* 月份框 */}
      <View className="month-box">
        <Text className="month-number">{currentMonth}</Text>
        <Text className="month-unit">月</Text>
      </View>

      {/* 星期框 */}
      {weekDates.map((item, idx) => (
        <View
          key={idx}
          className={`week-day-box ${isToday(item) ? "today" : ""}`}
        >
          <Text className="day-number">{item.date}</Text>
          <Text className="day-week">{item.weekStr}</Text>
        </View>
      ))}
    </View>
  );
}
