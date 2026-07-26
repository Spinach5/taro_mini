import { serverGet } from "../../../utils/platform/serverRequest";
import runtimeLogger from "../../../utils/common/runtimeLogger";
import withCache from "../../../utils/common/withCache";

function unwrapProtobuf(val) {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object') return val;
  if ('String' in val && 'Valid' in val) {
    return val.Valid ? val.String : '';
  }
  if ('Number' in val && 'Valid' in val) {
    return val.Valid ? val.Number : 0;
  }
  return val;
}

function normalizeClassName(item) {
  if (typeof item === 'string') return { class_id: 0, class_name: item, major: '', department: '' };
  return {
    class_id: item.class_id ?? item.ClassId ?? 0,
    class_name: unwrapProtobuf(item.class_name ?? item.ClassName ?? ''),
    major: unwrapProtobuf(item.major ?? item.Major ?? ''),
    department: unwrapProtobuf(item.department ?? item.Department ?? ''),
    grade: unwrapProtobuf(item.grade ?? item.Grade ?? 0),
    student_count: unwrapProtobuf(item.student_count ?? item.StudentCount ?? 0),
    created_at: item.created_at ?? item.CreatedAt ?? '',
  };
}

function normalizeMaterial(item) {
  return {
    book_id: item.book_id ?? item.BookId ?? 0,
    isbn: unwrapProtobuf(item.isbn ?? item.Isbn ?? ''),
    title: unwrapProtobuf(item.title ?? item.Title ?? ''),
    author: unwrapProtobuf(item.author ?? item.Author ?? ''),
    publisher: unwrapProtobuf(item.publisher ?? item.Publisher ?? ''),
    price: unwrapProtobuf(item.price ?? item.Price ?? 0),
    created_at: item.created_at ?? item.CreatedAt ?? '',
    extra_info: unwrapProtobuf(item.extra_info ?? item.ExtraInfo ?? ''),
    semester: unwrapProtobuf(item.semester ?? item.Semester ?? ''),
    classes: Array.isArray(item.classes) ? item.classes.map(c => typeof c === 'string' ? c : unwrapProtobuf(c.class_name ?? c.ClassName ?? c)) : [],
  };
}

export const getMaterialSemesters = withCache(
  'v1_material_semesters_v2',
  5 * 60 * 1000,
  async () => {
    const res = await serverGet("/api/v1/materials/semesters");
    const data = (res && res.data) || [];
    return Array.isArray(data) ? data.map(item => unwrapProtobuf(item)) : [];
  },
);

export const getMaterialClasses = withCache(
  'v1_material_classes_v2',
  5 * 60 * 1000,
  async () => {
    const res = await serverGet("/api/v1/materials/classes");
    const data = (res && res.data) || [];
    return Array.isArray(data) ? data.map(normalizeClassName) : [];
  },
);

export async function getMaterialList({ semester, class_name } = {}) {
  try {
    const params = {};
    if (semester) params.semester = semester;
    if (class_name) params.class_name = class_name;
    const res = await serverGet("/api/v1/materials", params);
    const data = (res && res.data) || [];
    return {
      materials: Array.isArray(data) ? data.map(normalizeMaterial) : [],
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
      return normalizeMaterial(res.data);
    }
    throw new Error("教材不存在");
  } catch (error) {
    runtimeLogger.error("Material", "获取教材详情失败", error);
    throw error;
  }
}
