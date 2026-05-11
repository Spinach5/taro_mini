import { View, Text } from '@tarojs/components'
import { useEffect, useState } from 'react'
import './courseWeek.scss'

/**
 * 获取本周（周一 ~ 周日）的日期数组
 * @param {Date} today 当前日期
 * @returns {Array<{ date: number, month: number, weekStr: string }>}
 */
const getWeekDates = (today) => {
  const currentDay = today.getDay() // 0 周日 ~ 6 周六
  // 本周一的偏移量：周日(0) => -6，周一(1) => 0，周二(2) => -1 ...
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  const weekDays = []
  const weekStrMap = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    weekDays.push({
      date: day.getDate(),
      month: day.getMonth() + 1,
      weekStr: weekStrMap[i],
      fullDate: day, // 保存完整日期对象用于比较
    })
  }
  return weekDays
}

export default function WeekHeader() {
  const [currentMonth, setCurrentMonth] = useState(0)
  const [weekDates, setWeekDates] = useState([])
  const [todayDate, setTodayDate] = useState(null)

  useEffect(() => {
    const now = new Date()
    const month = now.getMonth() + 1
    setCurrentMonth(month)
    setTodayDate(now)

    const weekData = getWeekDates(now)
    setWeekDates(weekData)
  }, [])

  // 判断是否为今天
  const isToday = (dateItem) => {
    if (!todayDate) return false
    return (
      dateItem.date === todayDate.getDate() &&
      dateItem.month === todayDate.getMonth() + 1
    )
  }

  return (
    <View className='week-header'>
      {/* 月份框 */}
      <View className='month-box'>
        <Text className='month-number'>{currentMonth}</Text>
        <Text className='month-unit'>月</Text>
      </View>

      {/* 星期框 */}
      {weekDates.map((item, idx) => (
        <View
          key={idx}
          className={`week-day-box ${isToday(item) ? 'today' : ''}`}
        >
          <Text className='day-number'>{item.date}</Text>
          <Text className='day-week'>{item.weekStr}</Text>
        </View>
      ))}
    </View>
  )
}
