// utils/serverRequest.weapp.js
import Taro from "@tarojs/taro";
import userManager from "../service/userInfo";
import runtimeLogger from "./runtimeLogger";

const SERVER_BASE = "https://spinach.cc.cd";

/**
 * 统一请求函数（直接请求服务器，不走云函数）
 */
async function request(method, path, data, params) {
	let url = `${SERVER_BASE}${path}`;

	if (params) {
		const qs = Object.entries(params)
			.filter(([, v]) => v !== undefined && v !== null)
			.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
			.join("&");
		if (qs) url += `?${qs}`;
	}

	const headers = {};

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

export function serverPut(url, data) {
	return request("PUT", url, data);
}

export function serverDelete(url, data) {
	return request("DELETE", url, data);
}

export function serverPost(url, data) {
	return request("POST", url, data);
}

/**
 * 上传文件
 */
export async function serverUpload(url, filePath, params = {}) {
	const token = userManager.getServerToken();
	const header = {};
	if (token) {
		header["Authorization"] = `Bearer ${token}`;
	}

	try {
		const res = await Taro.uploadFile({
			url: `${SERVER_BASE}${url}`,
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

export default { serverGet, serverPost, serverPut, serverDelete, serverUpload };
