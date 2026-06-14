// 获取考试信息
// https://jwxt.hbut.edu.cn/admin/xsd/kwglXsdKscx/ajaxXsksList
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";
import { AutoRetry } from "./autoRetry";
import { extractExamInfo } from "../../utils/hbut/examHelper";
import runtimeLogger from "../../utils/runtimeLogger";

const CACHE_KEY = "v2_ExamInfoData_"; // 定义缓存key

export async function getExamInfo(semester, forceRefresh = false) {
	// 1. 优先从缓存获取
	console.log("传入的" + semester);
	const cached = cacheManager.get(CACHE_KEY + semester);
	if (cached && !forceRefresh) {
		console.log("[getExamInfo] 从缓存获取考试信息");
		return cached;
	}
	const fetchExamInfo = async () => {
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
			"admin/xsd/kwglXsdKscx/ajaxXsksList?xnxq=" + semester,
			loginConfig,
		);
		return response;
	};

	try {
		const response = await AutoRetry(fetchExamInfo, { maxRetry: 1 });
		// 检查 HTTP 状态码
		if (response.status !== 200) {
			console.log("[getExamInfo] 网络请求失败, status:", response.status);
			console.warn("获取考试信息失败：网络请求失败");
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getExamInfo] 登录失效，请重新登录");
			console.warn("获取考试信息失败：登录失效，请重新登录");
		}

		// 检查业务返回码
		if (response.data?.ret !== 0) {
			console.log("[getExamInfo] 接口返回异常:", response.data);
			console.warn("获取考试信息失败：接口返回 ret 不为 0");
		}

		const examResults = extractExamInfo(response.data);

		// 3. 存入缓存（永不过期）
		cacheManager.set(CACHE_KEY + semester, examResults);
		console.log("[getExamInfo] 已缓存考试信息");

		return examResults;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		runtimeLogger.error("ExamInfo", "获取考试信息失败", error);
		if (error instanceof Error) {
			throw error;
		}
		console.warn("获取考试信息失败：" + error);
		throw new Error(String(error));
	}
}
