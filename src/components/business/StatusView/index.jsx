import { View, Text } from '@tarojs/components';
import './index.css';

/**
 * 统一状态视图组件
 * 用于列表/页面的多状态展示（加载中、空数据、错误、成功）
 */
export default function StatusView({
  status,           // loading | empty | error | success
  loadingText = '加载中...',
  emptyText = '暂无数据',
  errorText = '加载失败，点击重试',
  onRetry,
  className = '',
  children,
}) {
  if (status === 'success') {
    return children;
  }

  return (
    <View
      className={`status-view ${className}`}
      onClick={status === 'error' && onRetry ? onRetry : undefined}
    >
      {status === 'loading' && (
        <>
          <View className="status-view__spinner" />
          <Text className="status-view__text">{loadingText}</Text>
        </>
      )}

      {status === 'empty' && (
        <Text className="status-view__text status-view__text--muted">
          {emptyText}
        </Text>
      )}

      {status === 'error' && (
        <Text className="status-view__text status-view__text--error">
          {errorText}
        </Text>
      )}
    </View>
  );
}
