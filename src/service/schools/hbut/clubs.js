// 社团相关 API（从后端获取，带缓存）
import { serverGet, serverPost } from "../../../utils/platform/serverRequest";
import runtimeLogger from "../../../utils/common/runtimeLogger";
import withCache from "../../../utils/common/withCache";

/**
 * 获取社团列表 + 种类（并行）
 */
export const getAllClub = withCache(
  'v1_clubs',
  5 * 60 * 1000,
  async () => {
    const [clubRes, catRes] = await Promise.all([
      serverGet("/api/v1/clubs"),
      serverGet("/api/v1/clubs/categories"),
    ]);

    const clubs = (clubRes && clubRes.data) || [];
    const catData = (catRes && catRes.data) || [];
    const categories = ["全部", ...(Array.isArray(catData) ? catData : [])];

    return { clubs, categories };
  },
);

/**
 * 获取社团种类
 */
export const getClubCategories = withCache(
  'v1_club_categories',
  5 * 60 * 1000,
  async () => {
    const res = await serverGet("/api/v1/clubs/categories");
    const data = (res && res.data) || [];
    return ["全部", ...(Array.isArray(data) ? data : [])];
  },
);

/**
 * 获取单个社团详情
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
 */
export async function addClub(data) {
  try {
    const res = await serverPost("/api/v1/clubs", data);
    if (res && res.success) {
      getAllClub.invalidate();
      getClubCategories.invalidate();
    }
    return res;
  } catch (error) {
    runtimeLogger.error("Clubs", "添加社团失败", error);
    throw error;
  }
}
