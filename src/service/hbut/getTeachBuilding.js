import cacheManager from "../../utils/cache";
import runtimeLogger from "../../utils/runtimeLogger";
import { extractTeachBuilding, extractTeachBuildingCategory } from "../../utils/hbut/extractTeachBuilding";

const CACHE_KEY_BUILDING = "TeachBuilding";
const CACHE_KEY_CATEGORY = "TeachBuildingCategory";

// H5 模式下 taro-axios-adapter 会丢失响应体，直接用 fetch 绕过
const API_URL = "/hbut/admin/system/jxzy/jsxx/queryForXsd";

// 模块级：去重并发请求
let _pendingRequest = null;

function _fetchHtml(forceRefresh) {
  if (forceRefresh) _pendingRequest = null;
  if (_pendingRequest) return _pendingRequest;

  _pendingRequest = (async () => {
    const resp = await fetch(API_URL, {
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: "https://jwxt.hbut.edu.cn",
        Origin: "https://jwxt.hbut.edu.cn",
      },
    });

    const text = await resp.text();

    // 检查是否为 JSON 错误响应
    if (/^\s*[\{\[]/.test(text)) {
      try {
        const json = JSON.parse(text);
        if (json.ret !== undefined && json.ret !== 0) {
          throw new Error(`教学楼接口返回 JSON (ret=${json.ret}): ${json.msg || json.message || text}`);
        }
      } catch (e) {
        if (e.message.includes("教学楼接口返回 JSON")) throw e;
      }
    }

    return text;
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
