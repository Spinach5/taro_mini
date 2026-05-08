import { View } from "@tarojs/components"
import './Btn.scss'
import {login} from '../utils/hbut/login'

export default function Btn({
  children,
  className = '',
  onClick=() => {login('2410321409','Spinach114514!')},
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
