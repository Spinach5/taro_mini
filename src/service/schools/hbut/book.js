// 二手书相关 API（从后端获取，带缓存）
import { serverGet, serverPost, serverPut, serverDelete, serverUpload } from "../../../utils/platform/serverRequest";
import cacheManager from "../../../utils/common/cache";
import runtimeLogger from "../../../utils/common/runtimeLogger";
import userManager from "../../userInfo";
import withCache from "../../../utils/common/withCache";

const CACHE_KEY_FAVORITES = "v1_favorite_book_ids";
const IS_DEV = process.env.NODE_ENV === "development";
const IS_WEAPP = process.env.TARO_ENV === "weapp";
// 小程序直接用域名；H5 开发走本地，生产走相对路径（通过 /server 代理）
const ASSET_BASE = IS_WEAPP ? "https://spinach.cc.cd" : (IS_DEV ? "http://localhost:3001" : "");

/** 构建鉴权参数：学校id、学号、RSA加密密码 */
function getAuthParams() {
  return {
    school_id: userManager.getSchoolId(),
    stu_id: userManager.stuId,
    password: userManager.getEncryptedPassword(),
  };
}

function resolveImage(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return ASSET_BASE + path;
}

/** 收藏相关（纯本地缓存，不走 withCache） */
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
  const currentUserId = userManager.getServerUserId();
  const isOwner = !!(currentUserId && String(b.user_id) === String(currentUserId));
  return {
    ...b,
    id: b.id || b.book_id,
    name: b.name || b.title,
    author: b.author || "",
    publisher: b.publisher || "",
    publisherName: b.publisherName || b.nickName || "",
    publishTime: b.publishTime || b.create_time || "",
    images: (b.images && b.images.length > 0 ? b.images.map(function(img) { return { ...img, url: resolveImage(img.url) }; }) : (b.image_url ? [{ url: resolveImage(b.image_url) }] : [])),
    wantCount: b.wantCount || b.want_count || 0,
    isDelivery: b.isDelivery !== undefined ? b.isDelivery : (b.is_delivery !== undefined ? b.is_delivery : 0),
    isPublisher: isOwner,
  };
}

/**
 * 获取书籍列表（分页，只缓存第一页）
 */
export const getBookList = withCache(
  'v1_books',
  5 * 60 * 1000,
  async ({ page = 1, pageSize = 20 } = {}) => {
    const params = { page, pageSize };
    const res = await serverGet("/api/v1/books", params);
    const rawBooks = (res && res.data) || [];
    const books = rawBooks.map(normalizeBook);
    return {
      books,
      total: (res && res.total) || 0,
    };
  },
  {
    keyBuilder: ([params]) => {
      const p = params || {};
      return p.page === 1 ? 'page1' : `page_${p.page}`;
    },
  },
);

/**
 * 获取书籍分类
 */
export const getBookCategories = withCache(
  'v1_book_categories',
  5 * 60 * 1000,
  async () => {
    const res = await serverGet("/api/v1/books/categories");
    const data = (res && res.data) || [];
    const cats = Array.isArray(data) ? data.filter((c) => c !== "全部") : [];
    return ["全部", ...cats];
  },
);

/**
 * 获取书籍详情
 */
export async function getBookDetail(id) {
  try {
    const res = await serverGet(`/api/v1/books/${id}`, getAuthParams());
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
 */
export async function createBook(data) {
  try {
    const res = await serverPost("/api/v1/books", { ...data, ...getAuthParams() });
    if (res && res.success) {
      getBookList.invalidateAll();
    }
    return res;
  } catch (error) {
    runtimeLogger.error("Books", "新增书籍失败", error);
    throw error;
  }
}

/**
 * 更新书籍
 */
export async function updateBook(id, data) {
  try {
    const res = await serverPut(`/api/v1/books/${id}`, { ...data, ...getAuthParams() });
    if (res && res.success) {
      getBookList.invalidateAll();
    }
    return res;
  } catch (error) {
    runtimeLogger.error("Books", "更新书籍失败", error);
    throw error;
  }
}

/**
 * 删除书籍
 */
export async function deleteBook(id) {
  try {
    const res = await serverDelete(`/api/v1/books/${id}`, getAuthParams());
    if (res && res.success) {
      getBookList.invalidateAll();
    }
    return res;
  } catch (error) {
    runtimeLogger.error("Books", "删除书籍失败", error);
    throw error;
  }
}

/**
 * 切换"想要"状态
 */
export async function toggleWantBook(id) {
  try {
    return await serverPost(`/api/v1/books/${id}/want`, getAuthParams());
  } catch (error) {
    runtimeLogger.error("Books", "切换想要状态失败", error);
    throw error;
  }
}

/**
 * 上传书籍图片
 */
export async function uploadBookImage(filePath) {
  try {
    const res = await serverUpload("/api/v1/books/upload", filePath);
    if (!res || !(res.data && res.data.url)) {
      throw new Error((res && res.message) || "上传失败");
    }
    return { url: resolveImage(res.data.url), imageId: res.data.imageId };
  } catch (error) {
    runtimeLogger.error("Books", "上传书籍图片失败", error);
    throw error;
  }
}

/**
 * 删除书籍图片
 */
export async function deleteBookImage(bookId, imageId) {
  try {
    const endpoint = bookId
      ? `/api/v1/books/${bookId}/images/${imageId}`
      : `/api/v1/books/images/${imageId}`;
    return await serverDelete(endpoint, getAuthParams());
  } catch (error) {
    runtimeLogger.error("Books", "删除书籍图片失败", error);
    throw error;
  }
}
