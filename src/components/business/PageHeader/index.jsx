import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { AtIcon } from 'taro-ui';
import './index.css';

/**
 * 统一页面头部组件
 * 蓝色渐变背景 + 返回按钮 + 标题 + 右侧操作区
 */
export default function PageHeader({
  title,
  showBack = true,
  backUrl = null,
  rightContent = null,
  onBack = null,
  className = '',
}) {
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (backUrl) {
      Taro.navigateTo({ url: backUrl });
    } else {
      Taro.navigateBack();
    }
  };

  return (
    <View className={`page-header ${className}`}>
      {showBack && (
        <View className="page-header__back" onClick={handleBack}>
          <AtIcon value="arrow-left" color="#ffffff" size={20} />
        </View>
      )}
      <Text className="page-header__title">{title}</Text>
      {rightContent && (
        <View className="page-header__right">{rightContent}</View>
      )}
    </View>
  );
}
