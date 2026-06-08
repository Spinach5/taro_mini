// 获取当前周数
// 每次调用都请求网络获取最新周数，成功后更新缓存；网络失败时回退到缓存
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";
import { AutoRetry } from "./autoRetry";
import runtimeLogger from "../../utils/runtimeLogger";

const CACHE_KEY = "CurrentWeek";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function getCurrentWeek() {
	const fetchCurrentWeek = async () => {
		const loginConfig = {
			headers: {
				"Content-Type":
					"application/x-www-form-urlencoded; charset=UTF-8",
				Referer: "https://jwxt.hbut.edu.cn",
				Origin: "https://jwxt.hbut.edu.cn",
			},
			withCredentials: true,
		};
		const response = await hbutRequest.post(
			"/admin/api/getXlzc",
			loginConfig,
		);
		return response; // 返回完整响应对象
	};

	try {
		const response = await AutoRetry(fetchCurrentWeek, { maxRetry: 1 });

		if (response.status !== 200) {
			console.log(
				"[getCurrentWeek] 网络请求失败, status:",
				response.status,
			);
			console.warn("获取当前周数失败：网络请求失败");
			// 网络异常时尝试走缓存兜底
			const cached = cacheManager.get(CACHE_KEY);
			if (cached !== null && cached !== undefined) {
				console.log("[getCurrentWeek] 网络异常，使用缓存兜底:", cached);
				return cached;
			}
			throw new Error(`网络请求失败, status: ${response.status}`);
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getCurrentWeek] 登录失效，请重新登录");
			console.warn("获取当前周数失败：登录失效，请重新登录");
		}

		// 检查业务返回码
		if (response.data?.ret !== 0) {
			console.log("[getCurrentWeek] 接口返回异常:", response.data);
			console.warn("获取当前周数失败：接口返回 ret 不为 0");
		}

		const currentWeek = response.data.data?.xlzc;

		// 验证数据有效性（类似 getXhid 中检查 id 是否存在）
		if (currentWeek === undefined || currentWeek === null) {
			console.log("[getCurrentWeek] 响应数据中无 xlzc 字段");
			console.warn("获取当前周数失败：响应数据中无 xlzc 字段");
			// 无效数据时尝试走缓存兜底
			const cached = cacheManager.get(CACHE_KEY);
			if (cached !== null && cached !== undefined) {
				console.log("[getCurrentWeek] 数据无效，使用缓存兜底:", cached);
				return cached;
			}
		}

		// 每次进入程序都获取最新周数并更新缓存
		cacheManager.set(CACHE_KEY, currentWeek, WEEK_MS);
		console.log("[getCurrentWeek] 已获取最新周数并缓存:", currentWeek);

		return currentWeek;
	} catch (error) {
		runtimeLogger.error("CurrentWeek", "获取当前周数失败", error);
		// 网络请求整体失败时尝试走缓存兜底
		const cached = cacheManager.get(CACHE_KEY);
		if (cached !== null && cached !== undefined) {
			console.log("[getCurrentWeek] 请求异常，使用缓存兜底:", cached);
			return cached;
		}
		if (error instanceof Error) {
			throw error;
		}
		console.warn("获取当前周数失败：" + error);
		throw new Error(String(error));
	}
}
