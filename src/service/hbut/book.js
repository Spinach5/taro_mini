// 二手书相关 API（从后端获取，带缓存）
import { serverGet, serverPost, serverPut, serverDelete, serverUpload } from "../../utils/serverRequest";
import cacheManager from "../../utils/cache";
import runtimeLogger from "../../utils/runtimeLogger";

const CACHE_KEY_BOOKS = "v1_books";
const CACHE_KEY_CATEGORIES = "v1_book_categories";
const CACHE_KEY_FAVORITES = "v1_favorite_book_ids";
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

/** 收藏相关（纯本地缓存） */
export function getFavoriteBookIds() {
  return cacheManager.get(CACHE_KEY_FAVORITES) || [];
}

export function addFavoriteBookId(bookId) {
  const ids = getFavoriteBookIds();
  if (!ids.includes(bookId)) {
    ids.push(bookId);
    cacheManager.set(CACHE_KEY_FAVORITES, ids);
  }
}

export function removeFavoriteBookId(bookId) {
  const ids = getFavoriteBookIds().filter((id) => id !== bookId);
  cacheManager.set(CACHE_KEY_FAVORITES, ids);
}

export function isFavoriteBook(bookId) {
  return getFavoriteBookIds().includes(bookId);
}

/**
 * 将后端字段映射为前端使用的字段名
 */
function normalizeBook(b) {
  return {
    ...b,
    id: b.id || b.book_id,
    name: b.name || b.title,
    publisherName: b.publisherName || b.nickName || "",
    publishTime: b.publishTime || b.create_time || "",
    images: b.images || (b.image_url ? [{ url: b.image_url }] : []),
    wantCount: b.wantCount || b.want_count || 0,
    isDelivery: b.isDelivery !== undefined ? b.isDelivery : (b.is_delivery !== undefined ? b.is_delivery : 0),
    isPublisher: b.isPublisher !== undefined ? b.isPublisher : false,
  };
}

/**
 * 获取书籍列表（分页 + 搜索 + 筛选 + 排序）
 * @param {object} opts
 * @param {number} opts.page
 * @param {number} opts.pageSize
 * @param {string} opts.keyword
 * @param {string} opts.category  "全部" 表示不筛选
 * @param {string} opts.sort      "time" 按时间 | "hot" 按热度
 * @param {boolean} forceRefresh
 * @returns {Promise<{ books: Array, total: number }>}
 */
export async function getBookList(
  { page = 1, pageSize = 20, keyword = "", category = "", sort = "time" } = {},
  forceRefresh = false,
) {
  const hasFilter = !!(keyword || (category && category !== "全部") || sort !== "time");

  // 有筛选条件时跳过缓存
  if (!forceRefresh && !hasFilter) {
    const cached = cacheManager.get(CACHE_KEY_BOOKS);
    if (cached && Array.isArray(cached.books)) {
      return cached;
    }
  }

  try {
    const params = { page, pageSize, sort };
    if (keyword) params.keyword = keyword;
    if (category && category !== "全部") params.category = category;

    const res = await serverGet("/api/v1/books", params);
    const rawBooks = (res && res.data) || [];
    const books = rawBooks.map(normalizeBook);
    const data = {
      books,
      total: (res && res.total) || 0,
    };

    // 只在无筛选条件时缓存首页
    if (!hasFilter && page === 1) {
      cacheManager.set(CACHE_KEY_BOOKS, data, CACHE_TTL);
    }

    return data;
  } catch (error) {
    runtimeLogger.error("Books", "获取书籍列表失败", error);
    throw error;
  }
}

/**
 * 获取书籍分类
 * @param {boolean} forceRefresh
 * @returns {Promise<string[]>}
 */
export async function getBookCategories(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cacheManager.get(CACHE_KEY_CATEGORIES);
    if (cached && Array.isArray(cached)) return cached;
  }

  try {
    const res = await serverGet("/api/v1/books/categories");
    const data = (res && res.data) || [];
    // 过滤掉后端可能返回的"全部"，再在前面添加
    const cats = Array.isArray(data) ? data.filter((c) => c !== "全部") : [];
    const categories = ["全部", ...cats];
    cacheManager.set(CACHE_KEY_CATEGORIES, categories, CACHE_TTL);
    return categories;
  } catch (error) {
    runtimeLogger.error("Books", "获取书籍分类失败", error);
    throw error;
  }
}

/**
 * 获取书籍详情
 * @param {string|number} id
 * @returns {Promise<object>}
 */
export async function getBookDetail(id) {
  try {
    const res = await serverGet(`/api/v1/books/${id}`);
    if (res && res.data) {
      return normalizeBook(res.data);
    }
    throw new Error("书籍不存在");
  } catch (error) {
    runtimeLogger.error("Books", "获取书籍详情失败", error);
    throw error;
  }
}

/**
 * 新增书籍
 * @param {object} data  { name, isbn, category, price, condition, description, images }
 * @returns {Promise<{ success: boolean, id: string }>}
 */
export async function createBook(data) {
  try {
    const res = await serverPost("/api/v1/books", data);
    if (res && res.success) {
      cacheManager.remove(CACHE_KEY_BOOKS);
    }
    return { url: res.data.url, imageId: res.data.imageId };
  } catch (error) {
    runtimeLogger.error("Books", "新增书籍失败", error);
    throw error;
  }
}

/**
 * 更新书籍
 * @param {string|number} id
 * @param {object} data
 * @returns {Promise<{ success: boolean }>}
 */
export async function updateBook(id, data) {
  try {
    const res = await serverPut(`/api/v1/books/${id}`, data);
    if (res && res.success) {
      cacheManager.remove(CACHE_KEY_BOOKS);
    }
    return { url: res.data.url, imageId: res.data.imageId };
  } catch (error) {
    runtimeLogger.error("Books", "更新书籍失败", error);
    throw error;
  }
}

/**
 * 切换"想要"状态
 * @param {string|number} id
 * @returns {Promise<{ success: boolean, isWanted: boolean }>}
 */
export async function toggleWantBook(id) {
  try {
    const res = await serverPost(`/api/v1/books/${id}/want`);
    return { url: res.data.url, imageId: res.data.imageId };
  } catch (error) {
    runtimeLogger.error("Books", "切换想要状态失败", error);
    throw error;
  }
}

/**
 * 上传书籍图片
 * @param {string} filePath  本地临时文件路径
 * @returns {Promise<{ url: string, imageId: string }>}
 */
export async function uploadBookImage(filePath) {
  try {
    const res = await serverUpload("/api/v1/books/upload", filePath);
    if (!res || !(res.data && res.data.url)) {
      throw new Error((res && res.message) || "上传失败");
    }
    return { url: res.data.url, imageId: res.data.imageId };
  } catch (error) {
    runtimeLogger.error("Books", "上传书籍图片失败", error);
    throw error;
  }
}

/**
 * 删除书籍图片
 * @param {string|number|null} bookId  新增模式下为 null
 * @param {string} imageId
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteBookImage(bookId, imageId) {
  try {
    const endpoint = bookId
      ? `/api/v1/books/${bookId}/images/${imageId}`
      : `/api/v1/books/images/${imageId}`;
    const res = await serverDelete(endpoint);
    return res;
  } catch (error) {
    runtimeLogger.error("Books", "删除书籍图片失败", error);
    throw error;
  }
}
