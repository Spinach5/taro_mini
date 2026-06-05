import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";
import runtimeLogger from "../../utils/runtimeLogger";
import { AutoRetry } from "./autoRetry";
import { extractTeachBuilding, extractTeachBuildingCategory } from "../../utils/hbut/extractTeachBuilding";

const CACHE_KEY_BUILDING = "TeachBuilding";
const CACHE_KEY_CATEGORY = "TeachBuildingCategory";

// 模块级：去重并发请求，两个函数共享同一个 in-flight promise
let _pendingRequest = null;

function _fetchHtml(forceRefresh) {
  if (forceRefresh) _pendingRequest = null;
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

  // 无论成功或失败，完成后清除 pending 状态，允许后续 forceRefresh 重新请求
  _pendingRequest.finally(() => {
    _pendingRequest = null;
  });

  return _pendingRequest;
}

function _validateAndGetHtml(response) {
  // 调试：打印 response 结构
  console.log("[_validateAndGetHtml] response type:", typeof response);
  console.log("[_validateAndGetHtml] response keys:", Object.keys(response));
  console.log("[_validateAndGetHtml] response.data:", response.data);
  console.log("[_validateAndGetHtml] response.status:", response.status);
  // 检查底层 XMLHttpRequest
  const req = response.request;
  console.log("[_validateAndGetHtml] response.request type:", typeof req);
  if (req) {
    console.log("[_validateAndGetHtml] request.responseText:", req.responseText?.substring(0, 200));
    console.log("[_validateAndGetHtml] request.response:", req.response?.substring?.(0, 200));
    console.log("[_validateAndGetHtml] request.responseType:", req.responseType);
  }

  // taro-axios-adapter 可能把响应体放在不同位置，先从多处尝试获取
  let data = response.data;

  // response.data 为 null/undefined 时，检查 response 自身或其他属性
  if (data == null) {
    if (typeof response === "string") {
      data = response;
    } else {
      // 遍历 response 的属性，找包含 <select 的字符串
      for (const key of Object.keys(response)) {
        const val = response[key];
        if (typeof val === "string" && /<select/i.test(val)) {
          data = val;
          break;
        }
      }
    }
  }

  // 1. 接口返回 JSON 对象（axios 自动解析）
  if (typeof data === "object" && data !== null) {
    const ret = data.ret;
    const msg = data.msg || data.message || JSON.stringify(data);
    throw new Error(`教学楼接口返回 JSON (ret=${ret}): ${msg}`);
  }

  // 2. 接口返回 JSON 字符串
  if (typeof data === "string" && /^\s*[\{\[]/.test(data)) {
    try {
      const json = JSON.parse(data);
      const ret = json.ret;
      const msg = json.msg || json.message || data;
      throw new Error(`教学楼接口返回 JSON (ret=${ret}): ${msg}`);
    } catch (e) { /* 不是有效 JSON，继续检查 HTML */ }
  }

  // 3. 检查是否为有效 HTML
  if (typeof data !== "string" || !/<select/i.test(data)) {
    const preview = typeof data === "string" ? data.substring(0, 300) : JSON.stringify(data).substring(0, 300);
    throw new Error("教学楼接口返回数据格式异常，未包含选择器。响应预览: " + preview);
  }

  return data;
}

export async function getTeachBuilding(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cacheManager.get(CACHE_KEY_BUILDING);
    if (cached) return cached;
  }

  try {
    const response = await _fetchHtml(forceRefresh);
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
    const response = await _fetchHtml(forceRefresh);
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
