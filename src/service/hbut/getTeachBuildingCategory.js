import cacheManager from "../../utils/cache";
import { hbutRequest } from "../../utils/request";
import runtimeLogger from "../../utils/runtimeLogger";
import { extractTeachBuildingCategory} from "../../utils/hbut/extractTeachBuilding";

const CACHE_KEY = "TeachBuildingCategory";

export async function getTeachBuildingCategory(forceRefresh = false) {
  // 1. 优先从缓存获取
  if (!forceRefresh) {
    const cached = cacheManager.get(CACHE_KEY);
    if (cached) {
      return cached;
    }
  }

  // 2. 缓存未命中，发起请求
  try {
    const response = await hbutRequest.get(
      "/admin/system/jxzy/jsxx/queryForXsd",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: "https://jwxt.hbut.edu.cn",
          Origin: "https://jwxt.hbut.edu.cn",
        },
        withCredentials: true,
        responseType: "text",
      },
    );

    // 3. 校验响应是否为HTML
    const html = response.data || response;
    if (typeof html !== "string" || !/<select/i.test(html)) {
      const preview = typeof html === "string" ? html.substring(0, 300) : String(html).substring(0, 300);
      throw new Error("教学楼接口返回数据格式异常，未包含选择器。响应预览: " + preview);
    }

    // 4. 提取教学楼映射
    const buildingData = extractTeachBuildingCategory(html);
    if (!buildingData || Object.keys(buildingData).length === 0) {
      throw new Error("未能解析到任何教室类型信息");
    }

    // 5. 存入缓存（永不过期）
    cacheManager.set(CACHE_KEY, buildingData);
    console.log("[getTeachBuilding] 已缓存教室类型");

    return buildingData;
  } catch (error) {
    runtimeLogger.error("TeachBuildingCategory", "获取教室类型失败", error);
    throw error;
  }
}
