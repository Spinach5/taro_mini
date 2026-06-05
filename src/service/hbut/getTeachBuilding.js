import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";
import runtimeLogger from "../../utils/runtimeLogger";
import { extractTeachBuilding, extractTeachBuildingCategory } from "../../utils/hbut/extractTeachBuilding";

const CACHE_KEY_BUILDING = "TeachBuilding";
const CACHE_KEY_CATEGORY = "TeachBuildingCategory";

const IS_H5 = process.env.TARO_ENV === "h5";
const API_PATH = "/admin/system/jxzy/jsxx/queryForXsd";

// 模块级：去重并发请求
let _pendingRequest = null;

function _fetchHtml(forceRefresh) {
  if (forceRefresh) _pendingRequest = null;
  if (_pendingRequest) return _pendingRequest;

  _pendingRequest = (async () => {
    if (IS_H5) {
      // H5 用 fetch 绕过 taro-axios-adapter 响应体丢失问题
      const resp = await fetch(`/hbut${API_PATH}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: "https://jwxt.hbut.edu.cn",
          Origin: "https://jwxt.hbut.edu.cn",
        },
      });
      return await resp.text();
    } else {
      // 微信小程序用 hbutRequest（Taro.request 正常工作且管理 cookie）
      const response = await hbutRequest.get(API_PATH, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: "https://jwxt.hbut.edu.cn",
          Origin: "https://jwxt.hbut.edu.cn",
        },
        withCredentials: true,
        responseType: "text",
      });
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
    const preview = typeof html === "string" ? html.substring(0, 300) : JSON.stringify(html).substring(0, 300);
    throw new Error("教学楼接口返回数据格式异常，未包含选择器。响应预览: " + preview);
  }
  return html;
}

export async function getTeachBuilding(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cacheManager.get(CACHE_KEY_BUILDING);
    if (cached) return cached;
  }

  try {
    const html = _validateAndGetHtml(await _fetchHtml(forceRefresh));

    const buildingData = extractTeachBuilding(html);
    if (!buildingData || Object.keys(buildingData).length === 0) {
      throw new Error("未能解析到任何教学楼信息");
    }

    cacheManager.set(CACHE_KEY_BUILDING, buildingData);
    console.log("[getTeachBuilding] 已缓存教学楼数据");

    return buildingData;
  } catch (error) {
    runtimeLogger.error("TeachBuilding", "获取教学楼信息失败", error);
    throw error;
  }
}

export async function getTeachBuildingCategory(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cacheManager.get(CACHE_KEY_CATEGORY);
    if (cached) return cached;
  }

  try {
    const html = _validateAndGetHtml(await _fetchHtml(forceRefresh));

    const categoryData = extractTeachBuildingCategory(html);
    if (!categoryData || Object.keys(categoryData).length === 0) {
      throw new Error("未能解析到任何教室类型信息");
    }

    cacheManager.set(CACHE_KEY_CATEGORY, categoryData);
    console.log("[getTeachBuildingCategory] 已缓存教室类型");

    return categoryData;
  } catch (error) {
    runtimeLogger.error("TeachBuildingCategory", "获取教室类型失败", error);
    throw error;
  }
}
