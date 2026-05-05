import { View } from "@tarojs/components"
import './Btn.scss'
import Taro from '@tarojs/taro'
import loginAndGetCookies from '../utils/auth'

export default function Btn({
  children,
  className = '',
  onClick=() => {loginAndGetCookies('13687106362','Spinach114514!')},
}) {
  return (
    <View
      className={`btn ${className}`}
      onClick={onClick}
    >
      {children}
    </View>
  )
}
