import { View } from "@tarojs/components";
import { getSafeArea } from "../service/safeArea";

export default function SaveAreaView({
    children,
    className = ''
}) {
    const isH5 = process.env.TARO_ENV === 'h5'
    const { top: cachedTop, bottom: cachedBottom } = getSafeArea();
    console.log('读取到安全距离:', { cachedTop, cachedBottom });
    const paddingTop = cachedTop || 0;
    const paddingBottom = cachedBottom || 0;
    return (
        <View
            className={className}
            style={{
                height: '100%',
                paddingTop: `${paddingTop}px`,
                paddingBottom: `${paddingBottom}px`,
                paddingLeft: "8px",
                paddingRight: "8px",
                background: `linear-gradient(to bottom, rgba(71,165,253) 0%, rgba(255,255,255) 40%)`,
                boxSizing: 'border-box',
            }}
        >
            {children}
        </View>
    )
}
