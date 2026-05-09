import { hbutRequest } from "../request";
import encryptPassword from "./loginEncrypt";
// login.js
import Taro from "@tarojs/taro";
import CookiesManager from "../cookies"; // 你的 Cookie 管理器

// 为 hbut 创建独立实例（或复用现有）
const cookieManager = new CookiesManager("hbut");

/**
 * 发送请求并自动处理 Set-Cookie（小程序版）
 */
async function requestWithCookies(url, method, data, headers = {}) {
	// 自动携带已保存的 Cookie
	const cookieString = cookieManager.toString();
	if (cookieString) {
		headers["Cookie"] = cookieString;
	}

	const res = await Taro.request({
		url,
		method,
		header: headers,
		data,
		redirect: "manual", // 禁止自动重定向，手动处理
		dataType: "text", // 预期返回 HTML
	});

	// 从响应头中提取 Set-Cookie 并保存到本地缓存
	const setCookieHeader =
		res.header["Set-Cookie"] || res.header["set-cookie"];
	if (setCookieHeader) {
		// setCookieHeader 可能是数组或字符串
		const cookieHeaders = Array.isArray(setCookieHeader)
			? setCookieHeader
			: [setCookieHeader];
		cookieHeaders.forEach((header) => {
			cookieManager.parseAndMerge(header); // 你的方法，解析 name=value 并存储
		});
	}

	// 如果是重定向（302），手动跟随
	if (res.statusCode === 302) {
		const location = res.header.Location || res.header.location;
		if (location) {
			const redirectUrl = location.startsWith("http")
				? location
				: `https://jwxt.hbut.edu.cn${location}`;
			// 再次请求重定向地址，此时 CookieManager 中已有 Session Cookie
			return requestWithCookies(redirectUrl, "GET", null, {
				"User-Agent":
					"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) ...",
			});
		}
	}

	return res;
}

/**
 * 登录教务系统（小程序专用）
 */
export async function login(stuID, password) {
	// 1. 加密密码
	let encodedPassword;
	try {
		encodedPassword = encryptPassword(password);
		if (!encodedPassword) {
			console.error("密码加密失败");
			return false;
		}
	} catch (e) {
		console.error(`加密异常: ${e.message}`);
		return false;
	}

	// 2. 构造 form-urlencoded 字符串
	const params = new URLSearchParams();
	params.append("username", stuID);
	params.append("password", encodedPassword);
	params.append("rememberMe", "1");
	params.append("vcode", "");
	params.append("jcaptchaCode", "");
	const bodyString = params.toString(); // 关键：转为字符串

	// 3. 发起登录请求
	const loginRes = await requestWithCookies(
		"https://jwxt.hbut.edu.cn/admin/login",
		"POST",
		bodyString,
		{
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
			"User-Agent":
				"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
		},
	);

	// 4. 判断登录是否成功
	// 登录成功后，最终响应的 HTML 应该包含 "教务管理系统" 或 "退出" 等字样
	const html = loginRes.data;
	if (html.includes("用户名或密码错误") || html.includes("验证码")) {
		console.error("登录失败：用户名密码错误或需要验证码");
		return false;
	}

	// 检查是否包含了登录成功后才有的关键 Cookie（如 username, puid）
	const cookies = cookieManager.getAll();
	if (cookies.username && cookies.puid) {
		console.log("登录成功，已保存 Cookie 到本地缓存");
		return true;
	}

	// 额外：如果重定向到了 /admin/index 也可以认为成功
	if (loginRes.statusCode === 200 && html.includes("退出")) {
		console.log("登录成功（通过页面内容判断）");
		return true;
	}

	console.warn("登录可能成功，但未检测到完整 Cookie");
	return false;
}
