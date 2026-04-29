import { View } from "@tarojs/components"
import { PropsWithChildren } from "react"
import { getSafeArea } from "../utils/safeArea"

interface SafeAreaViewProps {
    className?: string
    fullScreen?: boolean
}

export default function BasePage({
    children,
    className = '',
    fullScreen = false
}: PropsWithChildren<SafeAreaViewProps>) {
    const isH5 = process.env.TARO_ENV === 'h5'
    const { top: cachedTop, bottom: cachedBottom } = getSafeArea();
    const paddingtop = cachedTop
    return (
        <View
            className={className}
            style={
                fullScreen
                    ? {
                        height: isH5 ? '100dvh' : '100%',
                        // paddingTop: 'env(safe-area-inset-top)',
                        paddingTop: `${paddingtop}px`,
                        // 底部 = 原生安全区 + 自定义TabBar高度
                        paddingBottom: 'calc(env(safe-area-inset-bottom) + var(--tab-bar-height, 0px))',
                        // 低版本兼容
                        boxSizing: 'border-box',
                    }
                    : undefined
            }
        >
            {children}
        </View>
    )
}