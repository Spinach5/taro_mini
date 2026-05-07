import { request, getCookieObject } from "./request";
import { encryptByAES } from "./xxt"; // 请根据实际路径导入
import { API_BASE } from "../config/api";

// 超星登录及获取最终 Cookie 的函数
export default async function loginAndGetCookies(username, password) {
	let aeskey = "u2oh6Vu^HWe4_AES";
	try {
		const res = await request({
			url: `${API_BASE.passportStatic}/js/fanya/login.js`,
			method: "GET",
			responseType: "text",
			dataType: "script",
			header: {
				Referer: "https://i.chaoxing.com",
			},
		});
		console.log('当前 Cookie:', getCookieObject());
		console.log("获取密钥响应状态:", res.statusCode);

		if (res.data && typeof res.data === "string") {
			const match = res.data.match(/var transferKey\s*=\s*"([^"]+)"/);
			if (match) aeskey = match[1];
			console.log("AES 密钥:", aeskey);
		}
	} catch (e) {
		console.log("获取密钥失败:", e);
	}

	// 2. 加密凭证
	const encodedUser = encryptByAES(username, aeskey);
	const encodedPass = encryptByAES(password, aeskey);
	console.log("加密后的用户名和密码：", encodedUser, encodedPass);
	// 3. 发送登录请求（POST）
	const loginUrl = `${API_BASE.passport2}/fanyalogin`;
	const params = new URLSearchParams();
	params.append("uname", encodedUser);
	params.append("password", encodedPass);
	params.append("t", "true");

	const loginRes = await request({
		url: loginUrl,
		method: "POST",
		data: params.toString(),
		header: {
			"Content-Type": "application/x-www-form-urlencoded",
			 Referer: "https://passport2.chaoxing.com/login",
		},
	});
	console.log('当前 Cookie:', getCookieObject());
	const data = loginRes.data;
	if (!data || !data.status) {
		throw new Error("登录失败：" + JSON.stringify(data));
	}

	const realUrl = decodeURIComponent(data.url);
	console.log("登录成功，跳转地址：", realUrl);

	// 4. 依次访问几个关键 URL，同步 Cookie（后续请求会自动携带之前存储的 Cookie）
	// 访问跳转 URL
	await request({
		url: realUrl,
		header: { Referer: "https://i.chaoxing.com" },
	});
	console.log('当前 Cookie:', getCookieObject());
	// // 访问个人空间
	await request({
		url: `${API_BASE.i}/base`,
		header: { Referer: "https://i.chaoxing.com" },
	});
	console.log('当前 Cookie:', getCookieObject());
	// 访问 SSO 跳转地址
	const authUrl =
		`${API_BASE.vkb}/admin/api/xxtlogin?loginUrl=https%3A%2F%2Fhbut.jw.chaoxing.com%2Fadmin%2Flogin2%3Frole%3Dxs%26url%3Dhttps%253A%252F%252Fmitudz.jw.chaoxing.com%252Fviews%252FhomePage.html%253Frole%253D1%2526domainUrl%253Dhbut.jw.chaoxing.com`;
	await request({
		url: authUrl,
		header: { Referer: "https://i.chaoxing.com/base" },
	});
	console.log('当前 Cookie:', getCookieObject());
	console.log("登录与 Cookie 同步完成");
	// 最后返回当前存储的 Cookie 对象（供外部使用）
	const finalCookies = getCookieObject(); // 从 request.js 中导入
	console.log("最终 Cookie 对象：", finalCookies);
	return finalCookies;
}
