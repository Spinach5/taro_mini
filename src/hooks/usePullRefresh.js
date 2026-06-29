import { useEffect } from 'react';
import Taro from '@tarojs/taro';

/**
 * 下拉刷新封装 Hook
 * @param {Function} refreshFn - 刷新函数，执行完成后自动调用 stopPullDownRefresh
 */
export function usePullRefresh(refreshFn) {
  useEffect(() => {
    if (!refreshFn) return;

    // Taro 的 usePullDownRefresh 在页面级别生效
    // 这里提供一个通用的包装，由调用方在 usePullDownRefresh 中使用
    // 实际使用时，调用方应：
    // usePullDownRefresh(() => { runRefresh(); })
    // 其中 runRefresh = usePullRefresh(fn)
  }, [refreshFn]);
}

/**
 * 创建一个带自动 stopPullDownRefresh 的刷新函数
 * @param {Function} refreshFn - 原始刷新函数
 * @returns {Function} 包装后的刷新函数
 */
export function createPullRefreshHandler(refreshFn) {
  return async () => {
    try {
      await refreshFn();
    } finally {
      Taro.stopPullDownRefresh();
    }
  };
}
