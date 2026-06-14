// 获取考试成绩
//admin/xsd/xsdcjcx/xsdQueryXscjList?page.size=80
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";
import runtimeLogger from "../../utils/runtimeLogger";
import { extractScores } from "../../utils/hbut/scoresHelper"
import { AutoRetry } from "./autoRetry";

const CACHE_KEY_PREFIX = "v2_AllScores";
const DEFAULT_PAGE_SIZE = 80;

export async function getScores(semester, forceRefresh = false) {
	const cacheKey = `${CACHE_KEY_PREFIX}_${semester}`;

	// 1. 优先从缓存获取
	const cached = cacheManager.get(cacheKey);
	if (cached && !forceRefresh) {
		console.log("[getScores] 从缓存获取考试成绩数据");
		return cached;
	}

	const fetchScores = async (size = DEFAULT_PAGE_SIZE) => {
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
			`admin/xsd/xsdcjcx/xsdQueryXscjList?page.size=${size}`,
			loginConfig,
		);
		return response;
	};

	try {
		// 首次请求
		let response = await AutoRetry(fetchScores, { maxRetry: 1 });

		// 检查 HTTP 状态码
		if (response.status !== 200) {
			console.log("[getScores] 网络请求失败, status:", response.status);
			console.warn("获取考试成绩失败：网络请求失败");
			runtimeLogger.error("[getScores] 获取考试成绩失败：网络请求失败");
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getScores] 登录失效，请重新登录");
			console.warn("获取考试成绩失败：登录失效，请重新登录");
			runtimeLogger.error("[getScores] 获取考试成绩失败：登录失效，请重新登录");
			throw new Error("登录失效，请重新登录");
		}

		// 检查业务返回码
		if (response.data?.ret !== 0) {
			console.log("[getScores] 接口返回异常:", response.data);
			console.warn("获取考试成绩失败：接口返回 ret 不为 0");
			runtimeLogger.error("[getScores] 获取考试成绩失败：接口返回 ret 不为 0");
			throw new Error(`接口返回异常: ret=${response.data?.ret}`);
		}

		// 如果 total 大于默认 pageSize，重新获取完整数据
		let scoresData;
		if (response.data.total > DEFAULT_PAGE_SIZE) {
			console.log(`[getScores] 成绩总数(${response.data.total})超过默认pageSize，重新获取完整数据`);
			response = await AutoRetry(() => fetchScores(response.data.total), { maxRetry: 1 });

			if (response.status !== 200) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			if (response.data?.ret !== 0) {
				throw new Error(`接口返回异常: ret=${response.data?.ret}`);
			}
		}

		// 提取实际的成绩数据
		scoresData = extractScores(response.data.results)

		// 存入缓存（永不过期）
		cacheManager.set(cacheKey, scoresData);
		console.log("[getScores] 已缓存考试成绩");

		return scoresData;
	} catch (error) {
		if (error instanceof Error) {
			console.warn("获取考试成绩失败：" + error.message);
			runtimeLogger.error("[getScores] 获取考试成绩失败：" + error.message);
			throw error;
		}
		console.warn("获取考试成绩失败：" + error);
		runtimeLogger.error("[getScores] 获取考试成绩失败：" + error);
		throw new Error("获取考试成绩失败");
	}
}
