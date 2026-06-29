import { hbutRequest } from "../../../utils/platform/request";
import withCache from "../../../utils/common/withCache";
import { getXhid } from "./GetXhid";
import { AutoRetry } from "./autoRetry";
import runtimeLogger from "../../../utils/common/runtimeLogger";

const _cachedStuInfo = withCache("v1_stu_info", 24 * 60 * 60 * 1000, async () => {
	const loginConfig = {
		headers: {
			"Content-Type":
				"application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		withCredentials: true,
	};

	// 获取 xhid
	const xhid = await getXhid();
	const fetchStuInfo = async () => {
		const response = await hbutRequest.get(
			`/admin/xsd/xskp/xskp?xhid=${xhid}`,
			loginConfig,
		);
		return response;
	};
	try {
		// 检查 HTTP 状态码
		const response = await AutoRetry(fetchStuInfo, { maxRetry: 1 });
		if (response.status !== 200) {
			console.log("[getStuInfo] 网络请求失败, status:", response.status);
			console.warn("获取个人信息失败:网络请求失败");
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getStuInfo] 登录失效，请重新登录");
			console.warn("获取个人信息失败：登录失效，请重新登录");
		}

		// 检查业务返回码
		if (response.data?.ret !== 0) {
			console.log("[getStuInfo] 接口返回异常:", response.data);
			console.warn("获取个人信息失败：接口返回 ret 不为 0");
		}

		const stuInfo = response.data.data;

		// 验证数据有效性
		if (!stuInfo) {
			console.log("[getStuInfo] 响应数据中无 data 字段");
			console.warn("获取个人信息失败：响应数据中无个人信息");
		}

		// 可选：进一步验证 scoresData 的结构是否符合预期
		if (typeof stuInfo !== "object") {
			console.log("[getStuInfo] 响应数据格式异常");
			console.warn("获取成绩数据失败：响应数据格式异常");
		}

		const cleanInfo = {
			realName: stuInfo.xm,
			stuId: stuInfo.xh,
			grade: stuInfo.sznj,
			majority: stuInfo.zymc,
			class: stuInfo.bjmc,
			college: stuInfo.skyx,
		};

		return cleanInfo;
	} catch (error) {
		runtimeLogger.error("StuInfo", "获取个人信息失败", error);
		if (error instanceof Error) {
			throw error;
		}
		throw new Error(String(error));
	}
});

export async function getStuInfo() {
	return _cachedStuInfo();
}
