import { getSemesterList as buildSemesterList } from "../../../utils/business/semesterHelper";
import { getGrade } from "../../userInfo";
import { hbutRequest } from "../../../utils/platform/request";
import withCache from "../../../utils/common/withCache";
import { AutoRetry } from "./autoRetry";
import runtimeLogger from "../../../utils/common/runtimeLogger";

const _cachedSemesterList = withCache("v1_semester_list", 24 * 60 * 60 * 1000, async () => {
	const loginConfig = {
		headers: {
			"Content-Type":
				"application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		withCredentials: true,
	};

	const fetchCurrentSemester = async () => {
		const response = await hbutRequest.get(
			"/admin/xsd/xsdcjcx/getCurrentXnxq",
			loginConfig,
		);
		return response; // 返回完整响应对象
	};
	try {
		const response = await AutoRetry(fetchCurrentSemester, { maxRetry: 1 });

		if (response.status !== 200) {
			console.warn(`网络请求失败，状态码: ${response.status}`);
		}
		if (response.data.ret !== 0) {
			console.warn(`接口返回异常: ret=${response.data.ret}`);
		}

		const CurrentSemesterData = response.data.data;
		const OriginYear = getGrade();
		if (OriginYear === "0") {
			console.log("[getSemesterList] 未获取到年级信息，请先登录");
			console.warn("获取当前学期失败：未获取到年级信息，请先登录");
		}
		const SemesterList = buildSemesterList(OriginYear, CurrentSemesterData);

		return SemesterList;
	} catch (error) {
		console.error("[getSemesterList] 获取失败:", error);
		runtimeLogger.error("CurrentSemester", "获取学期列表失败", error);
		throw error;
	}
});

export async function getSemesterList() {
	return _cachedSemesterList();
}
