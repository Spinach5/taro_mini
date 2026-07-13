import { hbutRequest } from "../../../utils/platform/request";
import withCache from "../../../utils/common/withCache";
import runtimeLogger from "../../../utils/common/runtimeLogger";
import { extractCourseProperty } from "../../../utils/business/hbut/extractTeachBuilding";

const IS_H5 = process.env.TARO_ENV === "h5";
const API_PATH = "/admin/xsd/studentpyfa";

let _pendingRequest = null;

function _fetchHtml(forceRefresh) {
	if (forceRefresh) _pendingRequest = null;
	if (_pendingRequest) return _pendingRequest;
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		withCredentials: true,
		responseType: "text",
	};

	_pendingRequest = (async () => {
		if (IS_H5) {
			const resp = await fetch(`/hbut${API_PATH}`, loginConfig);
			return await resp.text();
		} else {
			const response = await hbutRequest.get(API_PATH, loginConfig);
			return response.data;
		}
	})();

	_pendingRequest.finally(() => {
		_pendingRequest = null;
	});

	return _pendingRequest;
}

function _validateAndGetHtml(html) {
	if (typeof html !== "string" || !/<select/i.test(html)) {
		const preview =
			typeof html === "string"
				? html.substring(0, 300)
				: JSON.stringify(html).substring(0, 300);
		throw new Error(
			"课程性质接口返回数据格式异常，未包含选择器。响应预览: " + preview,
		);
	}
	return html;
}

const _cachedCourseProperty = withCache(
	"v1_course_property",
	24 * 60 * 60 * 1000,
	async () => {
		try {
			const html = _validateAndGetHtml(await _fetchHtml(false));

			const propertyData = extractCourseProperty(html);
			if (!propertyData || Object.keys(propertyData).length === 0) {
				throw new Error("未能解析到任何课程性质信息");
			}

			return propertyData;
		} catch (error) {
			runtimeLogger.error("CourseProperty", "获取课程性质失败", error);
			throw error;
		}
	},
);

export async function getCourseProperty(forceRefresh = false) {
	if (forceRefresh) {
		_cachedCourseProperty.invalidate();
		_pendingRequest = null;
	}
	return _cachedCourseProperty();
}
