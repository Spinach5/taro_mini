import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { AtIcon } from 'taro-ui';
import './index.css';

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
          <AtIcon value="arrow-left" color="#ffffff" size={24} />
        </View>
      )}
      <Text className="page-header__title">{title}</Text>
      {rightContent && (
        <View className="page-header__right">{rightContent}</View>
      )}
    </View>
  );
}
