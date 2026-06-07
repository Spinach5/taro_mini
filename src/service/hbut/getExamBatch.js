// 获取考试批次（所有周次信息）
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";
import { extractExamBatch } from "../../utils/hbut/examBatchHelper"
import { AutoRetry } from "./autoRetry";
import runtimeLogger from "../../utils/runtimeLogger";

const CACHE_KEY = "AllWeekData_"; // 定义缓存key

export async function getExamBatch(semester) {
	// 1. 优先从缓存获取
	console.log("传入的" + semester);
	const cached = cacheManager.get(CACHE_KEY + semester);
	if (cached && cached.length && cached[0]?.rqfw) {
		console.log("[getExamBatch] 从缓存获取考试批次");
		return cached;
	}
	if (cached) {
		cacheManager.remove(CACHE_KEY + semester);
		console.log("[getExamBatch] 缓存格式已过期，已清除");
	}

	const fetchAllWeek = async () => {
		const loginConfig = {
			headers: {
				"Content-Type":
					"application/x-www-form-urlencoded; charset=UTF-8",
				Referer: "https://jwxt.hbut.edu.cn",
				Origin: "https://jwxt.hbut.edu.cn",
			},
			withCredentials: true,
		};
		const response = await hbutRequest.get(
			`admin/xsd/kwglXsdKscx/getKspc?xnxq=${semester}`,
			loginConfig,
		);
		return response;
	};
	try {
		// 检查 HTTP 状态码
		const response = await AutoRetry(fetchAllWeek, { maxRetry: 1 });
		if (response.status !== 200) {
			console.log("[getExamBatch] 网络请求失败, status:", response.status);
			console.warn("获取考试批次失败：网络请求失败");
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getExamBatch] 登录失效，请重新登录");
			console.warn("获取考试批次失败：登录失效，请重新登录");
		}

		// 检查业务返回码
		if (response.data?.ret !== 0) {
			console.log("[getExamBatch] 接口返回异常:", response.data);
			console.warn("获取考试批次失败：接口返回 ret 不为 0");
		}

		const weekData = extractExamBatch(response.data);

		// 验证数据有效性（验证是否为数组且不为空）
		if (!weekData || !Array.isArray(weekData) || weekData.length === 0) {
			console.log("[getExamBatch] 响应数据中无有效的 data 字段");
			console.warn("获取考试批次失败：响应数据中无有效的排课周次数据");
		}

		// 3. 存入缓存（永不过期）
		cacheManager.set(CACHE_KEY + semester, weekData);
		console.log("[getExamBatch] 已缓存考试批次");

		return weekData;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		runtimeLogger.error("GetExamBatch", "获取考试批次失败", error);
		if (error instanceof Error) {
			throw error;
		}
		console.warn("获取考试批次失败：" + error);
		throw new Error(String(error));
	}
}
