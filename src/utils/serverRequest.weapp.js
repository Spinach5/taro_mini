// utils/serverRequest.weapp.js
import Taro from "@tarojs/taro";
import userManager from "../service/userInfo";
import runtimeLogger from "./runtimeLogger";

const SERVER_BASE = "https://8.148.69.248";

/**
 * 通过微信云函数转发请求到服务器
 * 云函数名: serverProxy
 * 云函数接收 { path, method, data, params } 并转发到 SERVER_BASE/{path}
 */
async function callCloudFunction(path, method, data, params) {
	// 构建查询字符串
	let fullPath = path;
	if (params) {
		const qs = Object.entries(params)
			.filter(([, v]) => v !== undefined && v !== null)
			.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
			.join("&");
		if (qs) fullPath += `?${qs}`;
	}

	const token = userManager.getServerToken();

	try {
		const res = await Taro.cloud.callFunction({
			name: "serverProxy",
			data: {
				url: `${SERVER_BASE}${fullPath}`,
				method,
				data: data || null,
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			},
		});

		// 云函数返回结构: { result: { status, data, headers } }
		if (res.result && res.result.status >= 400) {
			// 401/403 令牌失效，清除 token
			if (res.result.status === 401 || res.result.status === 403) {
				userManager.setServerToken("");
			}
			const msg =
				(res.result.data && res.result.data.message) ||
				`请求失败 (${res.result.status})`;
			throw new Error(msg);
		}

		return (res.result && res.result.data) || res.result;
	} catch (error) {
		runtimeLogger.error(
			"ServerRequest",
			`${method} ${path} 失败`,
			error?.message || error,
		);
		throw error;
	}
}

export function serverGet(url, params) {
	return callCloudFunction(url, "GET", null, params);
}

export function serverPost(url, data) {
	return callCloudFunction(url, "POST", data);
}

export default { serverGet, serverPost };
