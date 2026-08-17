// 通知中心（教务系统通知事项查询）
import { hbutRequest } from "../../../utils/platform/request";
import { HBUT_ORIGIN } from "../../../config/api";
import { AutoRetry } from "./autoRetry";
import { parseSelectOptions } from "../../../utils/business/hbut/notificationHelper";
import cacheManager from "../../../utils/common/cache";
import runtimeLogger from "../../../utils/common/runtimeLogger";

const IS_H5 = process.env.TARO_ENV === "h5";

// ─── 常量集中配置（假设项，便于联调调整） ───────────────────
export const FILTER_OPTIONS_CACHE_KEY = "v1_notice_filter_options";
/** 选项字典缓存 TTL：24 小时（假设 A3） */
export const FILTER_OPTIONS_TTL = 24 * 60 * 60 * 1000;
/** 默认字典（降级兜底，假设 A8） */
export const DEFAULT_FILTER_OPTIONS = {
  typeDict: {
    "": "全部",
    "2": "只显示已读",
    "3": "只显示未读",
    "4": "只显示申请",
    "5": "只显示收藏",
  },
  noticeTypeDict: {
    "": "全部",
    "0": "通知",
    "1": "审批待办",
    "2": "任务",
    "10": "抄送",
  },
};

const COMMON_HEADERS = {
  Referer: HBUT_ORIGIN,
  Origin: HBUT_ORIGIN,
};

/** 选项抓取单飞（同一次页面生命周期内仅一次请求，N-3） */
let filterOptionsInFlight = null;

// ─── 选项字典 ─────────────────────────────────────────────

function fetchFilterOptionsFromWeb() {
  const headers = {
    "Content-Type": "text/html; charset=UTF-8",
    ...COMMON_HEADERS,
  };
  // 返回 { data, status } 兼容 AutoRetry 的登录失效检测
  const fetchFn = async () => {
    if (IS_H5) {
      const resp = await fetch("/hbut/admin/system/tzsjx", {
        credentials: "include",
        headers,
      });
      const text = await resp.text();
      return { data: text, status: resp.status };
    }
    return hbutRequest.get("/admin/system/tzsjx", { headers });
  };

  return AutoRetry(fetchFn).then((response) => {
    const html = response.data;
    if (typeof html !== "string" || !html.trim()) {
      throw new Error("选项抓取返回非 HTML");
    }
    // 返回登录页视为会话失效 → 走降级（E-4）
    if (/login|用户名|密码/i.test(html)) {
      throw new Error("选项抓取返回登录页，会话失效");
    }
    const typeDict = parseSelectOptions(html, "type");
    const noticeTypeDict = parseSelectOptions(html, "noticeType");
    if (!typeDict || !noticeTypeDict) {
      throw new Error("选项解析结果为空");
    }
    return { typeDict, noticeTypeDict };
  });
}

/**
 * 获取通知筛选选项字典（缓存优先，失败回退默认字典）
 * @param {boolean} [forceRefresh=false] 忽略缓存强制抓取
 * @returns {Promise<{typeDict: Object, noticeTypeDict: Object, isFallback?: boolean}>}
 */
export async function getNoticeFilterOptions(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = cacheManager.get(FILTER_OPTIONS_CACHE_KEY);
    if (cached) {
      runtimeLogger.info("Notice", "筛选选项字典缓存命中", { forceRefresh });
      return cached;
    }
  }
  if (filterOptionsInFlight) {
    runtimeLogger.info("Notice", "筛选选项抓取进行中，复用单飞请求", { forceRefresh });
    return filterOptionsInFlight;
  }

  filterOptionsInFlight = (async () => {
    try {
      const options = await fetchFilterOptionsFromWeb();
      cacheManager.set(FILTER_OPTIONS_CACHE_KEY, options, FILTER_OPTIONS_TTL);
      runtimeLogger.info("Notice", "筛选选项字典抓取成功并写入缓存", {
        typeCount: Object.keys(options.typeDict || {}).length,
        noticeTypeCount: Object.keys(options.noticeTypeDict || {}).length,
        ttl: FILTER_OPTIONS_TTL,
      });
      return options;
    } catch (error) {
      runtimeLogger.error("Notice", "通知筛选选项抓取失败，使用默认选项", error);
      return { ...DEFAULT_FILTER_OPTIONS, isFallback: true };
    } finally {
      filterOptionsInFlight = null;
    }
  })();

  return filterOptionsInFlight;
}

// ─── 列表查询 ─────────────────────────────────────────────

function normalizeNoticeList(json) {
  const raw = Array.isArray(json.results) ? json.results : [];
  const list = raw.map((item) => ({
    id: item.id !== undefined && item.id !== null ? String(item.id) : "",
    title: item.title || "",
    releaseDate: item.releaseDate || "",
    noticeType: item.noticeType !== undefined && item.noticeType !== null ? String(item.noticeType) : "",
    noticeTypeName: item.noticeTypeName || "",
    content: item.content || "",
    dqstatus: item.dqstatus !== undefined && item.dqstatus !== null ? String(item.dqstatus) : "",
    collectstatus: item.collectstatus !== undefined && item.collectstatus !== null ? String(item.collectstatus) : "",
    dataXnxq: item.dataXnxq || "",
  }));
  return {
    list,
    page: Number(json.page) || 1,
    rows: Number(json.rows) || list.length,
    total: Number(json.total) || 0,
    totalPages: Number(json.totalPages) || 0,
    ret: json.ret,
    msg: json.msg || "",
  };
}

/**
 * 查询通知列表
 * @param {Object} params
 * @param {number} [params.page=1] 页码（从 1 开始）
 * @param {string} [params.content=""] 搜索内容
 * @param {string} [params.type=""] 查询类型 value
 * @param {string} [params.noticeType=""] 通知类型 value
 * @returns {Promise<{list: Array, page: number, rows: number, total: number, totalPages: number, ret: number, msg: string}>}
 */
export async function getNoticeList({ page = 1, content = "", type = "", noticeType = "" } = {}) {
  runtimeLogger.info("Notice", "通知列表请求发起", { page, content, type, noticeType });

  const params = new URLSearchParams({
    queryFields: "id,dqstatus,collectstatus,title,content,releaseDate,noticeTypeName",
    "page.size": "50",
    "page.pn": String(page),
    sort: "id",
    order: "asc",
    content: content || "",
    type: type || "",
    noticeType: noticeType || "",
  });
  const body = params.toString();
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    ...COMMON_HEADERS,
  };
  const url = "/admin/system/tzsjx/ajaxList?gridtype=jqgrid";

  // 返回 { data, status } 兼容 AutoRetry 的登录失效检测
  const fetchFn = async () => {
    if (IS_H5) {
      // H5 用原生 fetch 绕过 taro-axios-adapter 响应体丢失问题（C-1）
      const resp = await fetch(`/hbut${url}`, {
        method: "POST",
        credentials: "include",
        headers,
        body,
      });
      const text = await resp.text();
      let data = text;
      try {
        data = JSON.parse(text);
      } catch {
        // 保持原始文本，交由外层格式校验兜底
      }
      return { data, status: resp.status };
    }
    return hbutRequest.post(url, params, { headers });
  };

  const response = await AutoRetry(fetchFn);
  const json = response.data;

  if (!json || typeof json !== "object" || Array.isArray(json)) {
    runtimeLogger.warn("Notice", "通知列表返回格式异常", {
      page,
      dataType: typeof json,
      isArray: Array.isArray(json),
      rawPreview: typeof json === "string" ? json.slice(0, 200) : undefined,
    });
    throw new Error("通知列表返回格式异常");
  }
  if (json.ret !== 0) {
    runtimeLogger.warn("Notice", "通知接口业务码非 0", { page, ret: json.ret, msg: json.msg });
    throw new Error(`通知查询失败 (ret=${json.ret}): ${json.msg || ""}`);
  }
  const normalized = normalizeNoticeList(json);
  runtimeLogger.info("Notice", "通知列表查询成功", {
    page: normalized.page,
    totalPages: normalized.totalPages,
    total: normalized.total,
    listCount: normalized.list.length,
  });
  return normalized;
}
