// h5端根据 ip 获取经纬度
import Taro from "@tarojs/taro";
import { API_BASE } from "../config/api";
import createRequest from "./request";
import runtimeLogger from "./runtimeLogger";

/**
 * 通过 IP 定位获取当前大致经纬度（使用 ipapi.co）
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export default async function getLocation() {
	// 发起请求
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://ipapi.co",
			Origin: "https://ipapi.co",
		},
		withCredentials: true,
	};
	try {
		const response = await createRequest.get(
			API_BASE.ipapi + "json/",
			loginConfig,
		);

		// 检查 HTTP 状态码
		if (response.status !== 200) {
			console.error(
				"[getLocation] 网络请求失败, statusCode:",
				response.status,
			);
			throw new Error(`网络请求失败: ${response.status}`);
		}

		const data = response.data;

		// 检查业务错误（例如限流）
		if (data.error) {
			console.warn(
				"[getLocation] API 返回错误:",
				data.reason || data.message,
			);
			// 针对速率限制给出友好提示
			const title =
				data.reason === "RateLimited"
					? "获取位置过于频繁，请稍后再试"
					: data.message || "获取位置失败";
			Taro.showToast({
				title,
				icon: "none",
				duration: 2000,
			});
			throw new Error(data.reason || data.message);
		}

		// 校验返回的经纬度是否有效
		if (
			typeof data.latitude === "number" &&
			typeof data.longitude === "number"
		) {
			return {
				latitude: data.latitude,
				longitude: data.longitude,
			};
		} else {
			throw new Error("返回数据缺少经纬度信息");
		}
	} catch (error) {
		console.error("[getLocation] 异常:", error.message);
		runtimeLogger.error("getLocation", error.message);
		throw error; // 让调用方可以进一步处理
	}
}
