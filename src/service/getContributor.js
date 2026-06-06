import { giteeRequest } from "../utils/request";
import cacheManager from "../utils/cache";
import { cleanContributors, NAME_OVERRIDES } from "../utils/contributorHelp";

const CACHE_KEY = "Contributor"; // 定义缓存key

export async function getContributor(force = false) {
	// 1. 优先从缓存获取
	const cached = cacheManager.get(CACHE_KEY);
	if (cached && !force) {
		console.log("[getContributor] 从缓存获取贡献信息");
		// 对缓存的贡献者也应用名字覆盖映射
		if (cached.contributors) {
			cached.contributors = cached.contributors.map(c => ({
				...c,
				name: NAME_OVERRIDES[c.name] || c.name,
			}));
		}
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
			`api/v5/repos/damn_2/taro_mini/contributors`,
			loginConfig,
		);
		// 检查 HTTP 状态码
		if (response.status !== 200) {
			console.log("[getContributor] 网络请求失败, status:", response.status);
			console.warn("获取贡献信息失败：网络请求失败");
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getContributor] 重定向");
			console.warn("获取贡献信息失败：登录失效，请重新登录");
			return null;
		}

		// 检查业务返回码
		if (!response.data) {
			console.log("[getContributor] 返回异常:", response.data);
			console.warn("获取贡献信息失败：空数据");
			return null;
		}

		const Results = cleanContributors(response.data);

		// 3. 存入缓存（24小时后过期，确保名称变更能自动更新）
		const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;
		cacheManager.set(CACHE_KEY, Results, CACHE_EXPIRATION);
		console.log("[getContributor] 已缓存贡献信息");

		return Results;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		if (error instanceof Error) {
			throw error;
		}
		console.warn("获取贡献信息失败：" + error);
	}
}
