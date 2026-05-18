import { getSemesterList } from "../../utils/semesterHelper";
import { getGrade } from "../userInfo";
import { hbutRequest } from "../../utils/request";
import cacheManager from "../../utils/cache";

const CACHE_KEY = "Semester"; // 定义缓存key

export async function getSemeseterList() {
	// 1. 优先从缓存获取（和第一段一致）
	const cached = cacheManager.get(CACHE_KEY);
	if (cached) {
		console.log("[getSemeseterList] 从缓存获取当前学期");
		return cached;
	}
	try {
		const loginConfig = {
			headers: {
				"Content-Type":
					"application/x-www-form-urlencoded; charset=UTF-8",
				Referer: "https://jwxt.hbut.edu.cn",
				Origin: "https://jwxt.hbut.edu.cn",
			},
			withCredentials: true,
		};

		const response = await hbutRequest.get(
			"/admin/xsd/xsdcjcx/getCurrentXnxq",
			loginConfig,
		);

		// 检查 HTTP 状态码
		if (response.status !== 200) {
			console.log(
				"[getSemeseterList] 网络请求失败, status:",
				response.status,
			);
			throw new Error("获取课表失败：网络请求失败");
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getSemeseterList] 登录失效，请重新登录");
			throw new Error("获取课表失败：登录失效，请重新登录");
		}

		// 检查业务返回码
		if (response.data?.ret !== 0) {
			console.log("[getSemeseterList] 接口返回异常:", response.data);
			throw new Error("获取当前学期失败：接口返回 ret 不为 0");
		}

		const CurrentSemesterData = response.data.data;
		const OriginYear = getGrade();
		if(OriginYear === "0"){
			console.log("[getSemeseterList] 未获取到年级信息，请先登录");
			throw new Error("获取当前学期失败：未获取到年级信息，请先登录");
		}
		const SemesterList = getSemesterList(OriginYear, CurrentSemesterData);

		// 3. 存入缓存（永不过期，和第一段一致）
		cacheManager.set(CACHE_KEY, SemesterList);
		console.log("[getSemeseterList] 已缓存当前学期");

		return SemesterList;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("获取当前学期失败：" + error);
	}
}
