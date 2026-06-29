// 学生成绩绩点
// https://hbut.jw.chaoxing.com/admin/xsd/xskp/xyqk?fasz=1&xhid=...
import { hbutRequest } from "../../../utils/platform/request";
import withCache from "../../../utils/common/withCache";
import { getXhid } from "./GetXhid"; // 需要获取 xhid
import { AutoRetry } from "./autoRetry";
import runtimeLogger from "../../../utils/common/runtimeLogger";

const _cachedScores = withCache("v1_scores", 60 * 60 * 1000, async () => {
	const loginConfig = {
		headers: {
			"Content-Type":
				"application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		withCredentials: true,
	};

	// 获取 xhid（参考 URL 中的 xhid 参数）
	const xhid = await getXhid();

	const fetchScores = async () => {
		const response = await hbutRequest.get(
			`/admin/xsd/xskp/xyqk?xhid=${xhid}`,
			loginConfig,
		);
		return response;
	};

	try {
		const response = await AutoRetry(fetchScores, { maxRetry: 1 });
		// 检查 HTTP 状态码
		if (response.status !== 200) {
			console.log("[getScores] 网络请求失败, status:", response.status);
			console.warn("获取成绩数据失败：网络请求失败");
		}

		// 检查登录失效
		if (response.status === 300) {
			console.log("[getScores] 登录失效，请重新登录");
			console.warn("获取成绩数据失败：登录失效，请重新登录");
		}

		// 检查业务返回码
		if (response.data?.ret !== 0) {
			console.log("[getScores] 接口返回异常:", response.data);
			console.warn("获取成绩数据失败：接口返回 ret 不为 0");
		}

		const scoresData = response.data.data;

		// 验证数据有效性
		if (!scoresData) {
			console.log("[getScores] 响应数据中无 data 字段");
			console.warn("获取成绩数据失败：响应数据中无成绩数据");
		}

		// 可选：进一步验证 scoresData 的结构是否符合预期
		// 例如成绩通常应该是数组或包含特定字段的对象
		if (typeof scoresData !== "object") {
			console.log("[getScores] 响应数据格式异常");
			console.warn("获取成绩数据失败：响应数据格式异常");
		}

		const extractData = {
			gpa: scoresData.gpa,
			averageScore: scoresData.pjcj,
			notPass: scoresData.bjgms,
			gpaRank: scoresData.gpazypm,
			gottenCredits: scoresData.hdzxf,
			chosenClass: scoresData.yxkms,
		};

		return extractData;
	} catch (error) {
		// 如果错误已经是 Error 对象，直接抛出；否则包装一下
		runtimeLogger.error("Scores", "获取成绩绩点失败", error);
		if (error instanceof Error) {
			throw error;
		}
		console.warn("获取成绩数据失败：" + error);
		throw new Error(String(error));
	}
});

export async function getScores(forceRefresh = false) {
	if (forceRefresh) {
		_cachedScores.invalidate();
	}
	return _cachedScores();
}
