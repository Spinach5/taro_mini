import { giteeRequest } from "../utils/platform/request";
import cacheManager from "../utils/common/cache";
import { cleanLatestCommit } from "../utils/platform/cleanLatestCommit";

const CACHE_KEY = "LatestCommit"; // 定义缓存key

export async function getLatestCommit(force = false) {
	// 1. 优先从缓存获取
	const cached = cacheManager.get(CACHE_KEY);
	if (cached && !force) {
		console.log("[getLatestCommit] 从缓存获取最新提交");
		return cached;
	}
	const ref ="master"
	const loginConfig = {
			headers: {
				"Content-Type":
					"application/x-www-form-urlencoded; charset=UTF-8",
				Referer: "https://gitee.com",
				Origin: "https://gitee.com",
			},
			withCredentials: true,
		};


	try {
		const response = await giteeRequest.get(
			`api/v5/repos/damn_2/taro_mini/commits?page=1&per_page=1`,
			loginConfig,
		);
		// 检查 HTTP 状态码
		if (response.status !== 200) {
			console.log("[getLatestCommit] 网络请求失败, status:", response.status);
			console.warn("获取最新提交失败：网络请求失败");
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getLatestCommit] 重定向");
			console.warn("获取最新提交失败：登录失效，请重新登录");
			return null;
		}

		// 检查业务返回码
		if (!response.data) {
			console.log("[getLatestCommit] 返回异常:", response.data);
			console.warn("获取最新提交失败：空数据");
			return null;
		}

		const Results = cleanLatestCommit(response.data);

		// 3. 存入缓存（永不过期）
		cacheManager.set(CACHE_KEY, Results);
		console.log("[getLatestCommit] 已缓存最新提交信息");

		return Results;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		if (error instanceof Error) {
			throw error;
		}
		console.warn("获取最新提交失败：" + error);
	}
}
