import { View, Text } from '@tarojs/components';
import { MaterialCommunityIcons } from 'taro-icons';
import './index.css';

/**
 * 悬浮操作按钮（Floating Action Button）
 */
export default function FAB({
  icon = 'plus',
  text = '',
  onClick,
  position = 'bottom-right',
  bottom = '120rpx',
  color = '#fff',
  bgColor = '#47a5fd',
  size = 100,
}) {
  const posStyle = {
    bottom,
    ...(position === 'bottom-left' ? { left: '32rpx' } : { right: '32rpx' }),
  };

  return (
    <View
      className="fab"
      style={{
        ...posStyle,
        width: `${size}rpx`,
        height: `${size}rpx`,
        backgroundColor: bgColor,
      }}
      onClick={onClick}
    >
      <MaterialCommunityIcons name={icon} size={size * 0.45} color={color} />
      {text ? <Text className="fab__text" style={{ color }}>{text}</Text> : null}
    </View>
  );
}
