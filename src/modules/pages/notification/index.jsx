import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, Text, Input, Picker, RichText } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { AtIcon } from "taro-ui";
import SafeAreaView from "../../../components/base/SafeAreaView";
import Loading from "../../../components/base/Loading";
import PageHeader from "../../../components/business/PageHeader";
import DetailModal from "../../../components/business/DetailModal";
import { getNoticeFilterOptions, getNoticeList } from "../../../service/schools/hbut/notification";
import { sanitizeHtml } from "../../../utils/common/htmlSanitize";
import { getColorFromName } from "../../../utils/common/getHashCode";
import runtimeLogger from "../../../utils/common/runtimeLogger";
import userManager from "../../../service/userInfo";
import "./index.scss";

// ─── 常量集中配置（假设项，便于联调调整） ───────────────────
/** 已读状态映射（假设 A2）："1" = 未读，其余视为已读 */
const READ_STATUS_MAP = { "1": "unread" };
/** 搜索输入长度上限（假设 A4） */
const MAX_KEYWORD_LENGTH = 100;
/** 下拉自动查询防抖时长（N-2） */
const AUTO_QUERY_DEBOUNCE = 300;

function NoticeCard({ item, onClick }) {
  const unread = READ_STATUS_MAP[item.dqstatus] === "unread";
  const typeName = item.noticeTypeName || item.noticeType || "通知";
  const typeColor = getColorFromName(typeName);

  return (
    <View
      className={`notice-card bora ${unread ? "is-unread" : ""}`}
      onClick={onClick}
    >
      <View className="notice-card-title-row">
        {unread && <View className="unread-dot" />}
        <Text className="notice-card-title">{item.title}</Text>
        {!unread && <Text className="notice-read-tag">已读</Text>}
      </View>
      <Text className="notice-card-date">{item.releaseDate}</Text>
      <Text className="notice-card-type" style={{ color: typeColor }}>
        {typeName}
      </Text>
    </View>
  );
}

export default function NotificationPage() {
  const [authState, setAuthState] = useState("checking"); // checking | logged-out | logged-in
  const [listState, setListState] = useState("idle"); // idle | loading | success | empty | error
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [typeValue, setTypeValue] = useState("");
  const [noticeTypeValue, setNoticeTypeValue] = useState("");

  const [typeDict, setTypeDict] = useState({});
  const [noticeTypeDict, setNoticeTypeDict] = useState({});
  const [filterReady, setFilterReady] = useState(false);

  const [detail, setDetail] = useState(null);

  // 请求竞态保护（E-6）：最新请求优先
  const seqRef = useRef(0);
  // 单飞保护（N-2/N-3）：请求进行中不重复发请求
  const fetchLockRef = useRef(false);
  const pendingRef = useRef(false);
  const debounceTimerRef = useRef(null);

  // 始终引用最新筛选条件，避免防抖/异步回调读到过期闭包
  const filtersRef = useRef({ keyword: "", type: "", noticeType: "" });
  filtersRef.current = {
    keyword: keyword.trim().slice(0, MAX_KEYWORD_LENGTH),
    type: typeValue,
    noticeType: noticeTypeValue,
  };
  const authRef = useRef(authState);
  authRef.current = authState;

  useEffect(() => () => clearTimeout(debounceTimerRef.current), []);

  const checkLoginStatus = useCallback(() => {
    try {
      const loggedIn = userManager.checkLogin();
      setAuthState((prev) => {
        if (loggedIn && prev !== "logged-in") {
          runtimeLogger.info("Notice", "登录态变更：已登录", { from: prev });
          return "logged-in";
        }
        if (!loggedIn && prev !== "logged-out") {
          runtimeLogger.info("Notice", "登录态变更：未登录", { from: prev });
          return "logged-out";
        }
        return prev;
      });
    } catch (error) {
      console.error("获取登录状态失败", error);
      setAuthState("logged-out");
    }
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  useDidShow(() => {
    checkLoginStatus();
  });

  // E-10：登出后清空列表与选项视图，平滑切回「请先登录」
  useEffect(() => {
    if (authState !== "logged-out") return;
    seqRef.current++; // 使进行中的请求过期
    pendingRef.current = false;
    setList([]);
    setListState("idle");
    setPage(1);
    setTotalPages(0);
    setTotal(0);
    setTypeDict({});
    setNoticeTypeDict({});
    setFilterReady(false);
  }, [authState]);

  const runQuery = useCallback(async (targetPage, reason = "unknown") => {
    if (authRef.current !== "logged-in") return;
    if (fetchLockRef.current) {
      pendingRef.current = true; // 请求进行中：挂起，结束后以最新条件重跑
      runtimeLogger.info("Notice", "列表请求进行中，本次触发挂起", { reason, targetPage });
      return;
    }
    fetchLockRef.current = true;
    const seq = ++seqRef.current;
    setListState("loading");
    runtimeLogger.info("Notice", "列表查询触发", {
      reason,
      targetPage,
      filters: filtersRef.current,
    });

    // 注意：服务层解构字段为 content，需将 keyword 映射过去
    const { keyword: content, type, noticeType } = filtersRef.current;
    const params = { page: targetPage, content, type, noticeType };
    try {
      const data = await getNoticeList(params);
      if (seqRef.current !== seq) {
        runtimeLogger.info("Notice", "列表响应过期，丢弃", { reason, targetPage });
        return; // 过期响应直接丢弃
      }
      setList(data.list);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setListState(data.list.length > 0 ? "success" : "empty");
      runtimeLogger.info("Notice", "列表查询完成", {
        reason,
        state: data.list.length > 0 ? "success" : "empty",
        page: data.page,
        totalPages: data.totalPages,
        total: data.total,
        listCount: data.list.length,
      });
    } catch (error) {
      if (seqRef.current !== seq) {
        runtimeLogger.info("Notice", "过期响应异常丢弃", { reason, targetPage });
        return;
      }
      runtimeLogger.error("Notice", "通知列表查询失败", {
        message: error?.message || String(error),
        reason,
        targetPage,
      });
      setListState("error");
    } finally {
      fetchLockRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        runtimeLogger.info("Notice", "挂起期间条件已变化，从第 1 页重跑");
        runQuery(1, "pending"); // 挂起期间条件已变化，以最新条件从第 1 页重跑
      }
    }
  }, []);

  // 首次进入 / 登录态恢复：加载选项字典 → 自动查询（F-2 + F-4 + A1）
  useEffect(() => {
    if (authState !== "logged-in") return;
    let cancelled = false;
    (async () => {
      const options = await getNoticeFilterOptions();
      if (cancelled) return;
      setTypeDict(options.typeDict || {});
      setNoticeTypeDict(options.noticeTypeDict || {});
      runtimeLogger.info("Notice", "筛选选项字典就绪", {
        isFallback: !!options.isFallback,
        typeCount: Object.keys(options.typeDict || {}).length,
        noticeTypeCount: Object.keys(options.noticeTypeDict || {}).length,
      });
      if (options.isFallback) {
        Taro.showToast({ title: "通知筛选选项加载失败，已使用默认选项", icon: "none" });
      }
      // E-9：选中项在新字典中不存在时回退为「全部」
      setTypeValue((prev) =>
        options.typeDict && options.typeDict[prev] !== undefined ? prev : ""
      );
      setNoticeTypeValue((prev) =>
        options.noticeTypeDict && options.noticeTypeDict[prev] !== undefined ? prev : ""
      );
      setFilterReady(true);
      runQuery(1, "auto-init"); // 默认条件自动查询一次
    })();
    return () => {
      cancelled = true;
    };
  }, [authState, runQuery]);

  usePullDownRefresh(() => {
    if (authState === "logged-in") {
      runQuery(1, "pull-refresh").finally(() => Taro.stopPullDownRefresh());
    } else {
      Taro.stopPullDownRefresh();
    }
  });

  // 字典 → 有序下拉列表（空 value「全部」恒在最前）
  const toOrderedList = useCallback((dict) => {
    const entries = Object.entries(dict || {});
    return [
      ...entries.filter(([k]) => k === ""),
      ...entries.filter(([k]) => k !== ""),
    ].map(([value, text]) => ({ value, text }));
  }, []);

  const typeList = useMemo(() => toOrderedList(typeDict), [typeDict, toOrderedList]);
  const noticeTypeList = useMemo(() => toOrderedList(noticeTypeDict), [noticeTypeDict, toOrderedList]);
  const typeNames = useMemo(() => typeList.map((t) => t.text), [typeList]);
  const noticeTypeNames = useMemo(() => noticeTypeList.map((t) => t.text), [noticeTypeList]);
  const typePickerIndex = Math.max(0, typeList.findIndex((t) => t.value === typeValue));
  const noticeTypePickerIndex = Math.max(0, noticeTypeList.findIndex((t) => t.value === noticeTypeValue));

  const handleSearch = useCallback(() => {
    if (listState === "loading") return; // 查询进行中防重复
    runQuery(1, "search");
  }, [listState, runQuery]);

  // 下拉变化：页码重置为 1 + 防抖自动查询（F-9 + A1 + N-2）
  const scheduleAutoQuery = useCallback(() => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => runQuery(1, "filter-change"), AUTO_QUERY_DEBOUNCE);
  }, [runQuery]);

  const handleKeywordChange = useCallback((e) => {
    const value = e.detail.value || "";
    // 输入仅重置页码，不自动请求（由「查询」按钮/键盘搜索键触发）
    setKeyword(value.length > MAX_KEYWORD_LENGTH ? value.slice(0, MAX_KEYWORD_LENGTH) : value);
    setPage(1);
  }, []);

  const handleTypeChange = useCallback((e) => {
    const value = typeList[Number(e.detail.value)]?.value ?? "";
    setTypeValue(value);
    scheduleAutoQuery();
  }, [typeList, scheduleAutoQuery]);

  const handleNoticeTypeChange = useCallback((e) => {
    const value = noticeTypeList[Number(e.detail.value)]?.value ?? "";
    setNoticeTypeValue(value);
    scheduleAutoQuery();
  }, [noticeTypeList, scheduleAutoQuery]);

  const handlePrev = useCallback(() => {
    if (page <= 1 || listState === "loading") return;
    runQuery(page - 1, "prev");
  }, [page, listState, runQuery]);

  const handleNext = useCallback(() => {
    if (totalPages <= 1 || page >= totalPages || listState === "loading") return;
    runQuery(page + 1, "next");
  }, [page, totalPages, listState, runQuery]);

  if (authState === "checking") {
    return (
      <SafeAreaView>
        <Loading />
      </SafeAreaView>
    );
  }

  if (authState === "logged-out") {
    return (
      <SafeAreaView>
        <PageHeader title="通知" onBack={() => Taro.switchTab({ url: "/pages/index/index" })} />
        <View className="notLoginView">
          <Text className="notLoginText">请先登录</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canPrev = page > 1;
  const canNext = totalPages > 1 && page < totalPages;

  return (
    <SafeAreaView>
      <PageHeader title="通知" onBack={() => Taro.switchTab({ url: "/pages/index/index" })} />

      <View className="notice-page">
        {/* 筛选区（F-3） */}
        <View className="filter-bar">
          <Input
            className="search-input bora"
            placeholder="搜索通知内容"
            value={keyword}
            onInput={handleKeywordChange}
            onConfirm={handleSearch}
            confirmType="search"
            maxlength={MAX_KEYWORD_LENGTH}
          />
          <Picker
            mode="selector"
            range={typeNames}
            value={typePickerIndex}
            onChange={handleTypeChange}
            disabled={!filterReady}
          >
            <View className="filter-item bora">
              <Text className="filter-label">查询类型</Text>
              <Text className="filter-value">
                {typeList[typePickerIndex]?.text || "全部"}
                <Text className="filter-arrow">▼</Text>
              </Text>
            </View>
          </Picker>
          <Picker
            mode="selector"
            range={noticeTypeNames}
            value={noticeTypePickerIndex}
            onChange={handleNoticeTypeChange}
            disabled={!filterReady}
          >
            <View className="filter-item bora">
              <Text className="filter-label">通知类型</Text>
              <Text className="filter-value">
                {noticeTypeList[noticeTypePickerIndex]?.text || "全部"}
                <Text className="filter-arrow">▼</Text>
              </Text>
            </View>
          </Picker>
          <View
            className={`search-btn bora ${listState === "loading" ? "is-disabled" : ""}`}
            onClick={handleSearch}
          >
            <AtIcon value="search" size={20} color="#fff" />
            <Text className="search-text">查询</Text>
          </View>
        </View>

        {/* 列表区（F-5/F-6/F-8） */}
        <View className="notice-list">
          {listState === "loading" && (
            <View className="list-status">
              <AtIcon value="loading" size={48} className="spin-icon" />
              <Text className="status-text">加载中...</Text>
            </View>
          )}

          {listState === "empty" && (
            <View className="list-status">
              <AtIcon value="inbox" size={64} color="#ccc" />
              <Text className="status-text">暂无通知</Text>
            </View>
          )}

          {listState === "error" && (
            <View className="list-status">
              <AtIcon value="alert-circle" size={64} color="#ccc" />
              <Text className="status-text">加载失败，请检查网络后重试</Text>
              <View className="retry-btn bora" onClick={handleSearch}>
                <Text className="retry-text">重试</Text>
              </View>
            </View>
          )}

          {listState === "success" &&
            list.map((item) => (
              <NoticeCard key={item.id} item={item} onClick={() => setDetail(item)} />
            ))}
        </View>

        {/* 分页控件（F-8） */}
        {listState === "success" && totalPages > 1 && (
          <View className="pagination-bar">
            <View
              className={`pagination-btn bora ${canPrev ? "" : "is-disabled"}`}
              onClick={handlePrev}
            >
              <Text>‹ 上一页</Text>
            </View>
            <Text className="pagination-info">
              第 {page} / {totalPages} 页 · 共 {total} 条
            </Text>
            <View
              className={`pagination-btn bora ${canNext ? "" : "is-disabled"}`}
              onClick={handleNext}
            >
              <Text>下一页 ›</Text>
            </View>
          </View>
        )}
      </View>

      {/* 详情弹窗（F-7） */}
      <DetailModal visible={!!detail} title={detail?.title || ""} onClose={() => setDetail(null)}>
        <View className="detail-row">
          <Text className="detail-label">学期</Text>
          <Text className="detail-value">{detail?.dataXnxq || "—"}</Text>
        </View>
        <View className="detail-row">
          <Text className="detail-label">发布时间</Text>
          <Text className="detail-value">{detail?.releaseDate || "—"}</Text>
        </View>
        <View className="detail-row">
          <Text className="detail-label">通知类型</Text>
          <Text
            className="detail-value"
            style={{
              color: getColorFromName(detail?.noticeTypeName || detail?.noticeType || "通知"),
            }}
          >
            {detail?.noticeTypeName || detail?.noticeType || "通知"}
          </Text>
        </View>
        <View className="detail-row classes-row">
          <Text className="detail-label">正文</Text>
          <View className="detail-value notice-content">
            <RichText nodes={sanitizeHtml(detail?.content || "")} />
          </View>
        </View>
      </DetailModal>
    </SafeAreaView>
  );
}
