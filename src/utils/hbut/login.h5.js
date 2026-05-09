import { hbutRequest } from "../request";
import encryptPassword from "./loginEncrypt";

// 登录教务系统
export async function login(stuID, password) {
	let encodedPassword;
	try {
		encodedPassword = encryptPassword(password);
		if (!encodedPassword || encodedPassword === false) {
			console.error("加密失败，公钥无效或密码为空");
			return null;
		}
		console.log(`加密结果: ${String(encodedPassword)}`);
	} catch (e) {
		console.error(`执行 JS 加密函数出错: ${e.message}`);
		return null;
	}
	const params = new URLSearchParams();
	params.append("username", stuID);
	params.append("password", encodedPassword);
	params.append("rememberMe", "1");
	params.append("vcode", ""); //设置为空
	params.append("jcaptchaCode", ""); //设置为空

	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn", // 用真实域名而非代理地址
			Origin: "https://jwxt.hbut.edu.cn",
		},
		withCredentials: true,
	};
	const response = await hbutRequest.post(
		"/admin/login",
		params,
		loginConfig,
	);
	console.log("登录请求结果:", response.data);
	const params2 = new URLSearchParams();
	params2.append("zc", 10);
	const response2 = await hbutRequest.post(
		"/admin/getXqByZc",
		params2,
		loginConfig,
	);
	console.log("获取学期请求结果:", response2.data);
}
