import { View, Text, Image } from "@tarojs/components"
import Taro from '@tarojs/taro'
import './gridItem.scss'

export default function GridItem({
  url,
  icon,
  text='无',
  className = '',
  onClick,
  navigate = true,
  navigateType = 'navigateTo'
}) {

  const handleClick = () => {
    // 优先使用外部传入的点击事件
    if (onClick) {
      onClick()
      return
    }

    // 跳转页面
    if (navigate && url) {
      switch (navigateType) {
        case 'redirectTo':
          Taro.redirectTo({ url })
          break
        case 'switchTab':
          Taro.switchTab({ url })
          break
        case 'reLaunch':
          Taro.reLaunch({ url })
          break
        default:
          Taro.navigateTo({ url })
      }
    }
  }

  return (
    <View className={`my-item ${className}`} onClick={handleClick}>
      <View className="icon-wrapper">
        <Image src={icon} className="grid-icon" />
      </View>
      <Text className="grid-text">{text}</Text>
    </View>
  )
}
