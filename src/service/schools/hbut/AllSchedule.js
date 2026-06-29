// 获取所有课表
import { hbutRequest } from "../../../utils/platform/request";
import { getXhid } from "./GetXhid";
import { extractCourseData } from "../../../utils/business/hbut/courseHelper";
import { AutoRetry } from "./autoRetry";
import withCache from "../../../utils/common/withCache";
import runtimeLogger from "../../../utils/common/runtimeLogger";

const _cachedAllSchedule = withCache(
	"v1_all_schedule",
	30 * 60 * 1000,
	async (semester) => {
		// 实际请求函数
		const fetchSchedule = async () => {
			const xhid = await getXhid();
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
				`admin/pkgl/xskb/sdpkkbList?xnxq=${semester}&xhid=${xhid}`,
				loginConfig,
			);
			return response; // 返回完整响应对象
		};

		try {
			const response = await AutoRetry(fetchSchedule, { maxRetry: 1 });

			if (response.status !== 200) {
				console.warn(`网络请求失败，状态码: ${response.status}`);
			}
			if (response.data.ret !== 0) {
				console.warn(`接口返回异常: ret=${response.data.ret}`);
			}

			const courseData = extractCourseData(response.data.data);
			return courseData;
		} catch (error) {
			console.error("[getAllSchedule] 获取失败:", error);
			runtimeLogger.error("AllSchedule", "获取所有课表失败", error);
			throw error;
		}
	},
	{
		keyBuilder: ([semester]) => semester || "default",
	},
);

export async function getAllSchedule(forceRefresh = false, semester) {
	console.log(`[getAllSchedule] semester:${semester}`);
	if (forceRefresh) {
		_cachedAllSchedule.invalidate([semester]);
		console.log(`[getAllSchedule] 已清除${semester}课表缓存`);
	}
	return _cachedAllSchedule(semester);
}
