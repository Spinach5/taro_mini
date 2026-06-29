// utils/request.js
import axios from "axios";
import TaroAdapter from "taro-axios-adapter";
import CookiesManager from "./cookies"; // 导入 CookiesManager 类
import { API_BASE } from "../config/api";
import runtimeLogger from "./runtimeLogger";

/**
 * 创建带有 Cookie 自动管理的请求实例
 * @param {string} baseURL      基础 URL
 * @param {CookiesManager} cookieManager Cookie 管理器实例
 */
const createRequest = (baseURL, cookieManager) => {

	// eslint-disable-next-line import/no-named-as-default-member
	const instance = axios.create({
		baseURL,
		timeout: 15000,
		adapter: TaroAdapter,
		withCredentials: true, // 允许跨域带 Cookie
	});

	// 请求拦截器：添加 Cookie 头
	instance.interceptors.request.use(
		(config) => {
			console.log("请求拦截器");
			const cookieString = cookieManager.toString();
			if (cookieString) {
				config.headers["Cookie"] = cookieString;
			}
			return config;
		},
		(error) => {
			runtimeLogger.error("Request", "请求发送失败", error);
			return Promise.reject(error);
		},
	);

	// 响应拦截器：提取并保存 Set-Cookie
	instance.interceptors.response.use(
		(response) => {
			console.log("响应拦截器");
			const setCookie = response.headers["set-cookie"];
			if (setCookie) {
				// 兼容数组（axios 会将多个同名头合并为数组）或字符串
				const cookieHeaders = Array.isArray(setCookie)
					? setCookie
					: [setCookie];
				console.log(cookieHeaders);
				cookieHeaders.forEach((header) => {
					cookieManager.parseAndMerge(header);
				});
			}

			return response; //保留整个 response
		},
		(error) => {
			const url = error?.config?.url || error?.config?.baseURL || "unknown";
			const status = error?.response?.status;
			runtimeLogger.error(
				"Request",
				`响应异常 ${status || ""} ${url}`.trim(),
				error?.message || error,
			);
			return Promise.reject(error);
		},
	);

	return instance;
};

// 为不同后端创建独立的 Cookie 管理器实例（模块级，可供外部清除）
export const hbutCookies = new CookiesManager("hbut");
export const opendiffCookies = new CookiesManager("opendiff");
export const giteeCookies = new CookiesManager("gitee");
const defaultCookies = new CookiesManager("");

// 为不同后端创建请求实例（自动隔离 Cookie）
export const hbutRequest = createRequest(API_BASE.hbut, hbutCookies);
export const opendiffRequest = createRequest(API_BASE.opendiff, opendiffCookies);
export const giteeRequest = createRequest(API_BASE.gitee, giteeCookies);

// 默认实例（无 URL，用于相对路径请求）
export default createRequest("", defaultCookies);
