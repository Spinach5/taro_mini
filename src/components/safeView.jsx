// SaveAreaView.jsx
import { View } from "@tarojs/components";
import { getSafeArea } from "../service/safeArea";
import { useState, useEffect, useRef } from "react";
import Taro from "@tarojs/taro";
import TabBar from "./TabBar";

export default function SaveAreaView({ children, currentPath }) {
  const [tabBarHeight, setTabBarHeight] = useState(0);
  const safeArea = getSafeArea(); // 假设返回 { top, bottom }

  // 获取 TabBar 元素的实际高度
  const getTabBarHeight = () => {
    const query = Taro.createSelectorQuery();
    query.select('.tab-bar').boundingClientRect();
    query.exec(res => {
      if (res[0] && res[0].height) {
        setTabBarHeight(res[0].height);
      }
    });
  };

  useEffect(() => {
    // 延迟获取，确保 TabBar 已渲染
    setTimeout(getTabBarHeight, 100);
    // 监听窗口大小变化时重新获取（如旋转屏幕）
    Taro.eventCenter.on('resize', getTabBarHeight);
    return () => {
      Taro.eventCenter.off('resize', getTabBarHeight);
    };
  }, []);

  return (
    <>
      <View
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          paddingTop: `${safeArea.top}px`,
          paddingBottom: `${tabBarHeight + safeArea.bottom}px`, // 动态底部留白
          paddingLeft: "8px",
          paddingRight: "8px",
          background: `linear-gradient(to bottom, rgb(71,165,253) 0%, rgb(255,255,255) 40%)`,
          boxSizing: "border-box",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </View>
      <TabBar currentPath={currentPath} />
    </>
  );
}
