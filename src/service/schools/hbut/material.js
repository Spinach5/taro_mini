import { serverGet } from "../../../utils/platform/serverRequest";
import runtimeLogger from "../../../utils/common/runtimeLogger";
import withCache from "../../../utils/common/withCache";

export const getMaterialSemesters = withCache(
  'v1_material_semesters',
  5 * 60 * 1000,
  async () => {
    const res = await serverGet("/api/v1/materials/semesters");
    return (res && res.data) || [];
  },
);

export const getMaterialClasses = withCache(
  'v1_material_classes',
  5 * 60 * 1000,
  async () => {
    const res = await serverGet("/api/v1/materials/classes");
    return (res && res.data) || [];
  },
);

export async function getMaterialList({ semester, class_name } = {}) {
  try {
    const params = {};
    if (semester) params.semester = semester;
    if (class_name) params.class_name = class_name;
    const res = await serverGet("/api/v1/materials", params);
    return {
      materials: (res && res.data) || [],
      total: (res && res.total) || 0,
    };
  } catch (error) {
    runtimeLogger.error("Material", "获取教材列表失败", error);
    throw error;
  }
}

export async function getMaterialDetail(id) {
  try {
    const res = await serverGet(`/api/v1/materials/${id}`);
    if (res && res.data) {
      return res.data;
    }
    throw new Error("教材不存在");
  } catch (error) {
    runtimeLogger.error("Material", "获取教材详情失败", error);
    throw error;
  }
}
