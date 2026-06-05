import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";
import runtimeLogger from "../../utils/runtimeLogger";
import { AutoRetry } from "./autoRetry";
import { extractTeachBuilding, extractTeachBuildingCategory } from "../../utils/hbut/extractTeachBuilding";

const CACHE_KEY_BUILDING = "TeachBuilding";
const CACHE_KEY_CATEGORY = "TeachBuildingCategory";

// 模块级：去重并发请求，两个函数共享同一个 in-flight promise
let _pendingRequest = null;

function _fetchHtml() {
  if (_pendingRequest) return _pendingRequest;

  _pendingRequest = AutoRetry(async () => {
    return await hbutRequest.get("/admin/system/jxzy/jsxx/queryForXsd", {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: "https://jwxt.hbut.edu.cn",
        Origin: "https://jwxt.hbut.edu.cn",
      },
      withCredentials: true,
      responseType: "text",
    });
  }, { maxRetry: 1 });

  // 失败时清除缓存，允许后续重试
  _pendingRequest.catch(() => {
    _pendingRequest = null;
  });

  return _pendingRequest;
}

function _validateAndGetHtml(response) {
  const data = response.data;

  // 接口返回 JSON 错误（如未登录、会话过期等）
  if (typeof data === "object" && data !== null) {
    const ret = data.ret;
    const msg = data.msg || data.message || JSON.stringify(data);
    throw new Error(`教学楼接口返回 JSON (ret=${ret}): ${msg}`);
  }

  const html = data || response;
  if (typeof html !== "string" || !/<select/i.test(html)) {
    const preview = typeof html === "string" ? html.substring(0, 300) : String(html).substring(0, 300);
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
    const response = await _fetchHtml();
    const html = _validateAndGetHtml(response);

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
    const response = await _fetchHtml();
    const html = _validateAndGetHtml(response);

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
