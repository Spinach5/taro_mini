// login.js
import Taro from "@tarojs/taro";
import { checkStuID } from "../utils/checkStuID";
import userManager from "./userInfo";
import { getSchool } from "./router";
import runtimeLogger from "../utils/runtimeLogger";

const SUPPORTED_UNIVERSITIES = ["湖北工业大学", ""];

export async function login(stuId, password, university) {
	// 清除旧缓存
	userManager.logout();

	// 校验学校（修正 indexOf 逻辑）
	if (SUPPORTED_UNIVERSITIES.indexOf(university) === -1) {
		await Taro.showToast({ title: "暂不支持该学校", icon: "error" });
		return false;
	}

	if (!checkStuID(stuId)) {
		await Taro.showToast({ title: "学号格式错误", icon: "none" });
		return false;
	}
	if (!password) {
		await Taro.showToast({ title: "密码不能为空", icon: "none" });
		return false;
	}

	// 临时保存基本信息（auth 和 getSchool 需要通过 userManager 读取）
	userManager.setField("stuId", stuId);
	userManager.setField("university", university);
	userManager.setField("password", password);

	// 执行登录（auth 应根据 university 调用不同接口）
	const school = getSchool();
	let authRes;
	try {
		authRes = await school.auth();
	} catch (err) {
		runtimeLogger.error("Login", "登录请求异常", err);
		Taro.hideLoading();
		userManager.logout(); // 登录失败，清除已保存的信息
		await Taro.showModal({ title: "网络错误", content: "网络请求失败，请检查网络后重试", showCancel: false, confirmText: "知道了" });
		return false;
	}

	if (!authRes?.success) {
		const msg = authRes?.message || "登录失败，请检查账号密码";
		runtimeLogger.warn("Login", msg);
		Taro.hideLoading();
		userManager.logout(); // 登录失败，清除已保存的信息
		await Taro.showModal({ title: "登录失败", content: msg, showCancel: false, confirmText: "知道了" });
		return false;
	}

	// 获取用户详细信息
	let stuInfo;
	try {
		stuInfo = await school.getStuInfo();
	} catch (err) {
		runtimeLogger.error("Login", "获取用户信息失败", err);
		Taro.hideLoading();
		userManager.logout(); // 登录失败，清除已保存的信息
		await Taro.showModal({ title: "登录失败", content: "获取用户信息失败，请重试", showCancel: false, confirmText: "知道了" });
		return false;
	}

	if (!stuInfo) {
		Taro.hideLoading();
		userManager.logout(); // 登录失败，清除已保存的信息
		await Taro.showModal({ title: "登录失败", content: "获取用户信息失败，请重试", showCancel: false, confirmText: "知道了" });
		return false;
	}

	// 登录成功，补充用户详细信息
	userManager.setFields(stuInfo);
	userManager.setField("isLoggedIn", true);
	runtimeLogger.info("Login", `登录成功: ${stuInfo.stuId || stuId}`);
	await Taro.showToast({ title: "登录成功", icon: "success" });
	return true;
}
