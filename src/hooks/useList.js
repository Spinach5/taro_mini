import { useState, useCallback, useRef } from 'react';
import Taro, { usePullDownRefresh } from '@tarojs/taro';

/**
 * 通用列表 Hook
 * @param {Function} fetchFn - 数据获取函数 (params, forceRefresh?) => Promise<{list/data/books, total}>
 * @param {Object} options - 配置项
 * @param {number} options.defaultPageSize - 默认每页条数，默认 20
 * @param {boolean} options.immediate - 是否立即加载，默认 true（注意：需在 useLoad 中手动调用 load）
 * @param {string} options.dataKey - 返回数据中列表字段名，自动检测 list/data/books
 * @returns {Object} { data, total, page, loading, error, load, loadMore, refresh, setData, reset }
 */
export function useList(fetchFn, options = {}) {
  const {
    defaultPageSize = 20,
    dataKey = null,
  } = options;

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState('idle'); // idle | loading | loading-more | success | error | empty
  const [error, setError] = useState(null);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  /** 从返回结果中提取列表数据 */
  const extractList = useCallback((result) => {
    if (dataKey && result[dataKey]) return result[dataKey];
    if (result.list) return result.list;
    if (result.data) return result.data;
    if (result.books) return result.books;
    if (Array.isArray(result)) return result;
    return [];
  }, [dataKey]);

  /** 加载指定页 */
  const load = useCallback(
    async (targetPage = 1, forceRefresh = false) => {
      const isLoadingMore = targetPage > 1;
      setLoading(isLoadingMore ? 'loading-more' : 'loading');
      setError(null);

      try {
        const result = await fetchFnRef.current(
          { page: targetPage, pageSize: defaultPageSize },
          forceRefresh,
        );

        const list = extractList(result);
        const resultTotal = result.total || 0;

        if (isLoadingMore) {
          setData((prev) => [...prev, ...list]);
        } else {
          setData(list);
        }

        setTotal(resultTotal);
        setPage(targetPage);
        setLoading(list.length === 0 && targetPage === 1 ? 'empty' : 'success');
      } catch (err) {
        setError(err);
        setLoading('error');
        if (!isLoadingMore) {
          setData([]);
        }
      }
    },
    [defaultPageSize, extractList],
  );

  /** 加载更多 */
  const loadMore = useCallback(() => {
    if (loading === 'loading-more' || loading === 'loading') return;
    if (data.length >= total && total > 0) return;
    load(page + 1);
  }, [loading, data.length, total, page, load]);

  /** 下拉刷新 */
  const refresh = useCallback(async () => {
    await load(1, true);
    Taro.stopPullDownRefresh();
  }, [load]);

  /** 重置状态 */
  const reset = useCallback(() => {
    setData([]);
    setTotal(0);
    setPage(1);
    setLoading('idle');
    setError(null);
  }, []);

  // 注册下拉刷新
  usePullDownRefresh(() => {
    refresh();
  });

  return {
    data,
    total,
    page,
    loading,
    error,
    load,
    loadMore,
    refresh,
    setData,
    reset,
  };
}
