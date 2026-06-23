// utils/serverRequest.h5.js
import Taro from "@tarojs/taro";
import userManager from "../service/userInfo";
import runtimeLogger from "./runtimeLogger";

const IS_DEV = process.env.NODE_ENV === "development";
const BASE_URL = IS_DEV ? "http://localhost:3001" : "/server";

/**
 * 统一请求函数
 * @param {string} method
 * @param {string} path  如 "/api/v1/auth/check-user"
 * @param {object} data  POST body
 * @param {object} params  GET 查询参数
 */
async function request(method, path, data, params) {
	let url = `${BASE_URL}${path}`;

	// 构建查询字符串
	if (params) {
		const qs = Object.entries(params)
			.filter(([, v]) => v !== undefined && v !== null)
			.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
			.join("&");
		if (qs) url += `?${qs}`;
	}

	const headers = {};

	// 注入 JWT token
	const token = userManager.getServerToken();
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	if (data) {
		headers["Content-Type"] = "application/json";
	}

	try {
		const res = await Taro.request({
			url,
			method,
			data,
			header: headers,
		});

		if (res.statusCode >= 400) {
			// 401/403 令牌失效，清除 token
			if (res.statusCode === 401 || res.statusCode === 403) {
				userManager.setServerToken("");
			}
			const body = res.data;
			throw new Error(
				(body && body.message) || `请求失败 (${res.statusCode})`,
			);
		}

		return res.data;
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
	return request("GET", url, undefined, params);
}

export function serverPost(url, data) {
	return request("POST", url, data);
}

/**
 * 上传文件（H5 环境）
 * @param {string} url  如 "/api/v1/books/upload"
 * @param {string} filePath  本地临时文件路径
 * @param {object} params  额外 formData 字段
 * @returns {Promise<object>} 解析后的响应 JSON
 */
export async function serverUpload(url, filePath, params = {}) {
	const token = userManager.getServerToken();
	const header = {};
	if (token) {
		header["Authorization"] = `Bearer ${token}`;
	}

	try {
		const res = await Taro.uploadFile({
			url: `${BASE_URL}${url}`,
			filePath,
			name: "file",
			formData: params,
			header,
		});

		const body = JSON.parse(res.data);

		if (res.statusCode >= 400) {
			if (res.statusCode === 401 || res.statusCode === 403) {
				userManager.setServerToken("");
			}
			throw new Error(
				(body && body.message) || `上传失败 (${res.statusCode})`,
			);
		}

		return body;
	} catch (error) {
		runtimeLogger.error(
			"ServerRequest",
			`UPLOAD ${url} 失败`,
			error?.message || error,
		);
		throw error;
	}
}

export default { serverGet, serverPost, serverUpload };
