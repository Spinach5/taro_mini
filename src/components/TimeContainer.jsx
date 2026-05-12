import { View } from "@tarojs/components";
import "./TimeSlot.scss";
import { getTimeTable } from "../service/hubt/GetTimeTable";

/**
 * 课程时间段组件
 * @param {string} className - 外部传入的样式类名
 * @returns {string} semester - 学期
 */
export default function TimeContainer({ className = "" }) {
	return <View className={`time-slot ${className}`}></View>;
}
