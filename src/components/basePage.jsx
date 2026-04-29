import { View } from "@tarojs/components";
import { getSafeArea } from "../utils/safeArea";

export default function BasePage({
    children,
    className = '',
    fullScreen = true
}) {
    const isH5 = process.env.TARO_ENV === 'h5'
    const { top: cachedTop, bottom: cachedBottom } = getSafeArea();
    console.log('读取到安全距离:', { cachedTop, cachedBottom });
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
                        paddingLeft: "8px",
				        paddingRight: "8px",
                        // 底部 = 原生安全区 + 自定义TabBar高度
                        paddingBottom: 'calc(env(safe-area-inset-bottom) + var(--tab-bar-height, 0px))',
                        background: `linear-gradient(to bottom, rgba(71,165,253,1.00) 0%, rgba(255,255,255,0) 40%)`,
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