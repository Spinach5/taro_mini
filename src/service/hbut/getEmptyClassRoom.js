//admin/system/jxzy/jsxx/getKxjscx?&page.size=50&jxldm=9&type=1&zcStr=11&xqStr=3&jcStr=3%2C4
// 获取空教室
import { hbutRequest } from "../../utils/request";
import { extractEmpytClassRoom } from "../../utils/hbut/emptyClassRoom";
import { AutoRetry } from "./autoRetry";

export async function getEmptyRoom(Building,weekNum,week,sectionStr) {
	// 1. 不从缓存获取
	const fetchAllWeek = async () => {
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
			`admin/system/jxzy/jsxx/getKxjscx?&page.size=100&jxldm=${Building}&zcStr=${weekNum}&xqStr=${week}&jcStr=${sectionStr}`,
			loginConfig,
		);
		return response;
	};
	try {
		// 检查 HTTP 状态码
		const response = await AutoRetry(fetchAllWeek, { maxRetry: 1 });
		if (response.status !== 200) {
			console.log("[getEmptyRoom] 网络请求失败, status:", response.status);
			console.warn("获取空教室失败：网络请求失败");
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getEmptyRoom] 登录失效，请重新登录");
			console.warn("获取空教室失败：登录失效，请重新登录");
		}

		// 检查业务返回码
		if (response.data?.ret !== 0) {
			console.log("[getEmptyRoom] 接口返回异常:", response.data);
			console.warn("获取空教室失败：接口返回 ret 不为 0");
		}

		const rowData = response.data.results;

		// 验证数据有效性（验证是否为数组且不为空）
		if (!rowData || !Array.isArray(rowData) || rowData.length === 0) {
			console.log("[getEmptyRoom] 响应数据中无有效的 data 字段");
			console.warn("获取空教室失败：响应数据中无有效的空教室数据");
		}

		const weekData = extractEmpytClassRoom(rowData);
		return weekData;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		if (error instanceof Error) {
			throw error;
		}
		console.warn("获取空教室失败：" + error);
	}
}
