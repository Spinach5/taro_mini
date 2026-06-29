import { hbutRequest } from "../../../utils/platform/request";
import withCache from "../../../utils/common/withCache";
import runtimeLogger from "../../../utils/common/runtimeLogger";
import {
	extractTeachBuilding,
	extractTeachBuildingCategory,
} from "../../../utils/business/hbut/extractTeachBuilding";

const IS_H5 = process.env.TARO_ENV === "h5";
const API_PATH = "/admin/system/jxzy/jsxx/queryForXsd";

// 模块级：去重并发请求
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
			// H5 用 fetch 绕过 taro-axios-adapter 响应体丢失问题
			const resp = await fetch(`/hbut${API_PATH}`, loginConfig);
			return await resp.text();
		} else {
			// 微信小程序用 hbutRequest（Taro.request 正常工作且管理 cookie）
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
			"教学楼接口返回数据格式异常，未包含选择器。响应预览: " + preview,
		);
	}
	return html;
}

const _cachedTeachBuilding = withCache(
	"v1_teach_building",
	24 * 60 * 60 * 1000,
	async () => {
		try {
			const html = _validateAndGetHtml(await _fetchHtml(false));

			const buildingData = extractTeachBuilding(html);
			if (!buildingData || Object.keys(buildingData).length === 0) {
				throw new Error("未能解析到任何教学楼信息");
			}

			return buildingData;
		} catch (error) {
			runtimeLogger.error("TeachBuilding", "获取教学楼信息失败", error);
			throw error;
		}
	},
);

const _cachedTeachBuildingCategory = withCache(
	"v1_teach_building_category",
	24 * 60 * 60 * 1000,
	async () => {
		try {
			const html = _validateAndGetHtml(await _fetchHtml(false));

			const categoryData = extractTeachBuildingCategory(html);
			if (!categoryData || Object.keys(categoryData).length === 0) {
				throw new Error("未能解析到任何教室类型信息");
			}

			return categoryData;
		} catch (error) {
			runtimeLogger.error(
				"TeachBuildingCategory",
				"获取教室类型失败",
				error,
			);
			throw error;
		}
	},
);

export async function getTeachBuilding(forceRefresh = false) {
	if (forceRefresh) {
		_cachedTeachBuilding.invalidate();
		_pendingRequest = null; // reset dedup so _fetchHtml re-fetches
	}
	return _cachedTeachBuilding();
}

export async function getTeachBuildingCategory(forceRefresh = false) {
	if (forceRefresh) {
		_cachedTeachBuildingCategory.invalidate();
		_pendingRequest = null; // reset dedup so _fetchHtml re-fetches
	}
	return _cachedTeachBuildingCategory();
}
