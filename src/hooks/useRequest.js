import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 通用请求封装 Hook
 * @param {Function} requestFn - 请求函数
 * @param {Object} options - 配置项
 * @param {boolean} options.manual - 是否手动触发（true 则不自动执行）
 * @param {Array} options.defaultParams - 默认参数
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onError - 失败回调
 * @returns {Object} { data, loading, error, run, mutate }
 */
export function useRequest(requestFn, options = {}) {
  const {
    manual = false,
    defaultParams = [],
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(!manual);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // 组件卸载时标记
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args) => {
      if (!mountedRef.current) return;
      setLoading(true);
      setError(null);

      try {
        const result = await requestFn(...args);
        if (!mountedRef.current) return result;
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        if (!mountedRef.current) throw err;
        setError(err);
        onError?.(err);
        throw err;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [requestFn, onSuccess, onError],
  );

  const mutate = useCallback((newData) => {
    if (typeof newData === 'function') {
      setData((prev) => newData(prev));
    } else {
      setData(newData);
    }
  }, []);

  // 自动执行
  useEffect(() => {
    if (!manual) {
      run(...defaultParams).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, run, mutate };
}
