import Taro from "@tarojs/taro";
import { API_BASE } from "../config/api";
import createRequest from "./request"; // 默认导入已配置好的请求实例
import runtimeLogger from "./runtimeLogger";

export default async function getWeather(latitude, longitude) {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://api.open-meteo.com/",
			Origin: "https://api.open-meteo.com/",
		},
		withCredentials: true,
	};

	try {
		const response = await createRequest.get(
			`${API_BASE.open_meteo}v1/forecast?latitude=${latitude}&longitude=${longitude}
			&daily=weather_code,temperature_2m_max,temperature_2m_min
			&hourly=precipitation_probability,weather_code,temperature_2m
			&current=temperature_2m,relative_humidity_2m,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,precipitation,pressure_msl
			&timezone=Asia/Shanghai
			&past_days=1`,
			loginConfig,
		);

		// 检查 HTTP 状态码
		const status = response.status || response.status;
		if (status !== 200) {
			console.error(
				"[getLocationFromCoords] 网络请求失败, status:",
				status,
			);
			throw new Error(`网络请求失败: ${status}`);
		}

		const data = response.data;

		// 校验响应数据是否包含必要字段
		if (!data || typeof data !== "object") {
			throw new Error("返回数据格式异常");
		}
		if(data.error){
			throw new Error("天气数据返回失败,原因"+data.reason);
		}

		return data;
	} catch (error) {
		console.error("[getLocationFromCoords] 请求失败:", error);
		runtimeLogger.error("[getLocationFromCoords] 获取天气数据失败:", error);
		throw new Error(`获取地理位置失败: ${error.message}`);
	}
}
