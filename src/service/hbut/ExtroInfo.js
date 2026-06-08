//https://jwxt.hbut.edu.cn/admin/api/getZclistByXnxq
// 获取实践信息
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";
import { AutoRetry } from "./autoRetry";
import { extractPracticeInfo } from "../../utils/hbut/extroInfoHelper";
import { getXhid } from "./GetXhid";
import runtimeLogger from "../../utils/runtimeLogger";

const CACHE_KEY = "ExtroInfoData_"; // 定义缓存key

export async function getExtroInfo(semester, forceRefresh = false) {
	// 1. 强制刷新时清除缓存
	if (forceRefresh) {
		cacheManager.remove(CACHE_KEY + semester);
		console.log(`[getExtroInfo] 已清除${semester}实践信息缓存`);
	} else {
		const cached = cacheManager.get(CACHE_KEY + semester);
		if (cached) {
			console.log("[getExtroInfo] 从缓存获取实践信息");
			return cached;
		}
	}
	const fetchExtroInfo = async () => {
		const loginConfig = {
			headers: {
				"Content-Type":
					"application/x-www-form-urlencoded; charset=UTF-8",
				Referer: "https://jwxt.hbut.edu.cn",
				Origin: "https://jwxt.hbut.edu.cn",
			},
			withCredentials: true,
		};
		const xhid = await getXhid();
		const params = new URLSearchParams();

		params.append("xnxq", semester);
		params.append("userId", xhid);

		const response = await hbutRequest.post(
			"admin/api/getZclistByXnxq",
			params,
			loginConfig,
		);
		return response;
	};

	try {
		const response = await AutoRetry(fetchExtroInfo, { maxRetry: 1 });
		// 检查 HTTP 状态码
		if (response.status !== 200) {
			console.log(
				"[getExtroInfo] 网络请求失败, status:",
				response.status,
			);
			console.warn("获取实践信息失败：网络请求失败");
			return [];
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getExtroInfo] 登录失效，请重新登录");
			console.warn("获取实践信息失败：登录失效，请重新登录");
			return [];
		}

		// 检查业务返回码
		if (response.data?.ret !== 0) {
			console.log("[getExtroInfo] 接口返回异常:", response.data);
			console.warn("获取实践信息失败：接口返回 ret 不为 0");
			return [];
		}

		// 处理业务数据
		const sjkData = extractPracticeInfo(response.data.data.bpkkc);

		// 3. 存入缓存（永不过期）
		cacheManager.set(CACHE_KEY+semester, sjkData);
		console.log("[getExtroInfo] 已缓存实践信息");

		return sjkData;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		runtimeLogger.error("ExtroInfo", "获取实践信息失败", error);
		if (error instanceof Error) {
			throw error;
		}
		console.warn("获取实践信息失败：" + error);
		throw new Error(String(error));
	}
}
