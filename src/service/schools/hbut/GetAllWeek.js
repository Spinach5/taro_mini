// 获取排课周次（所有周次信息）
import { hbutRequest } from "../../../utils/platform/request";
import withCache from "../../../utils/common/withCache";
import { extractZc } from "../../../utils/business/hbut/weekHelper";
import { AutoRetry } from "./autoRetry";
import runtimeLogger from "../../../utils/common/runtimeLogger";

const _cachedAllWeek = withCache(
	"v1_all_week",
	24 * 60 * 60 * 1000,
	async (semester) => {
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
				`/admin/api/getZclistByXnxq?xnxq=${semester}`,
				loginConfig,
			);
			return response;
		};
		try {
			// 检查 HTTP 状态码
			const response = await AutoRetry(fetchAllWeek, { maxRetry: 1 });
			if (response.status !== 200) {
				console.log(
					"[getAllWeek] 网络请求失败, status:",
					response.status,
				);
				console.warn("获取排课周次失败：网络请求失败");
			}

			// 检查登录失效
			if (response.status === 300) {
				console.log("[getAllWeek] 登录失效，请重新登录");
				console.warn("获取排课周次失败：登录失效，请重新登录");
			}

			// 检查业务返回码
			if (response.data?.ret !== 0) {
				console.log("[getAllWeek] 接口返回异常:", response.data);
				console.warn("获取排课周次失败：接口返回 ret 不为 0");
			}

			const weekData = extractZc(response.data);

			// 验证数据有效性（验证是否为数组且不为空）
			if (!weekData || !Array.isArray(weekData) || weekData.length === 0) {
				console.log("[getAllWeek] 响应数据中无有效的 data 字段");
				console.warn(
					"获取排课周次失败：响应数据中无有效的排课周次数据",
				);
			}

			return weekData;
		} catch (error) {
			// 如果错误已经是 Error 对象，直接抛出；否则包装一下
			runtimeLogger.error("GetAllWeek", "获取排课周次失败", error);
			if (error instanceof Error) {
				throw error;
			}
			console.warn("获取排课周次失败：" + error);
			throw new Error(String(error));
		}
	},
	{
		keyBuilder: ([semester]) => semester || "default",
	},
);

export async function getAllWeek(semester) {
	console.log("传入的" + semester);
	return _cachedAllWeek(semester);
}
