// 社团相关 API（从后端获取，带缓存）
import { serverGet, serverPost } from "../../utils/serverRequest";
import cacheManager from "../../utils/cache";
import runtimeLogger from "../../utils/runtimeLogger";

const CACHE_KEY_CLUBS = "v1_clubs";
const CACHE_KEY_CATEGORIES = "v1_club_categories";

/**
 * 获取社团列表 + 种类（并行）
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<{ clubs: Array, categories: string[] }>}
 */
export async function getAllClub(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cacheManager.get(CACHE_KEY_CLUBS);
    const cachedCats = cacheManager.get(CACHE_KEY_CATEGORIES);
    if (cached && Array.isArray(cached)) {
      return {
        clubs: cached,
        categories: cachedCats && Array.isArray(cachedCats) ? cachedCats : ["全部"],
      };
    }
  }

  try {
    const [clubRes, catRes] = await Promise.all([
      serverGet("/api/v1/clubs"),
      serverGet("/api/v1/clubs/categories"),
    ]);

    const clubs = (clubRes && clubRes.data) || [];
    cacheManager.set(CACHE_KEY_CLUBS, clubs);

    const catData = (catRes && catRes.data) || [];
    const categories = ["全部", ...(Array.isArray(catData) ? catData : [])];
    cacheManager.set(CACHE_KEY_CATEGORIES, categories);

    return { clubs, categories };
  } catch (error) {
    runtimeLogger.error("Clubs", "获取社团列表失败", error);
    throw error;
  }
}

/**
 * 获取社团种类
 * @param {boolean} forceRefresh 是否强制刷新
 * @returns {Promise<string[]>}
 */
export async function getClubCategories(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cacheManager.get(CACHE_KEY_CATEGORIES);
    if (cached && Array.isArray(cached)) return cached;
  }

  try {
    const res = await serverGet("/api/v1/clubs/categories");
    const data = (res && res.data) || [];
    const categories = ["全部", ...(Array.isArray(data) ? data : [])];
    cacheManager.set(CACHE_KEY_CATEGORIES, categories);
    return categories;
  } catch (error) {
    runtimeLogger.error("Clubs", "获取社团种类失败", error);
    throw error;
  }
}

/**
 * 获取单个社团详情
 * @param {string|number} id
 * @returns {Promise<Object>}
 */
export async function getClubDetail(id) {
  try {
    const res = await serverGet(`/api/v1/clubs/${id}`);
    if (res && res.data) return res.data;
    throw new Error("社团不存在");
  } catch (error) {
    runtimeLogger.error("Clubs", "获取社团详情失败", error);
    throw error;
  }
}

/**
 * 添加社团
 * @param {Object} data 社团数据
 * @returns {Promise<Object>}
 */
export async function addClub(data) {
  try {
    const res = await serverPost("/api/v1/clubs", data);
    if (res && res.success) {
      // 清除缓存，下次进入列表页时刷新
      cacheManager.remove(CACHE_KEY_CLUBS);
      cacheManager.remove(CACHE_KEY_CATEGORIES);
    }
    return res;
  } catch (error) {
    runtimeLogger.error("Clubs", "添加社团失败", error);
    throw error;
  }
}
