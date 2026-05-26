import { useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import HeadStatus from "../../../components/HeadStatus";
import SafeAreaView from "../../../components/SafeAreaView";
import userManager from "../../../service/userInfo";
import { useTheme } from "../../../utils/theme";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import "./index.css";

const STORAGE_KEY_FORCE = "settings_force_update";

function getStoredForceUpdate() {
  try {
    return !!Taro.getStorageSync(STORAGE_KEY_FORCE);
  } catch {
    return false;
  }
}

export default function Index() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [forceUpdate, setForceUpdate] = useState(false);
  const [darkLoading, setDarkLoading] = useState(false);
  const [forceLoading, setForceLoading] = useState(false);

  useEffect(() => {
    setForceUpdate(getStoredForceUpdate());
  }, []);

  const handleDarkMode = () => {
    console.log("[Settings] handleDarkMode clicked, current darkMode:", darkMode);
    const newVal = !darkMode;
    console.log("[Settings] toggling to:", newVal);
    try {
      setDarkLoading(true);
      toggleDarkMode(newVal);
      setTimeout(() => setDarkLoading(false), 400);
    } catch (e) {
      console.error("[Settings] handleDarkMode error:", e);
      setDarkLoading(false);
    }
  };

  const handleForceUpdate = () => {
    console.log("[Settings] handleForceUpdate clicked, current:", forceUpdate);
    const newVal = !forceUpdate;
    setForceLoading(true);
    setForceUpdate(newVal);
    Taro.setStorageSync(STORAGE_KEY_FORCE, newVal);
    setTimeout(() => setForceLoading(false), 400);
  };

  const handleClearCache = () => {
    Taro.showModal({
      title: "提示",
      content: "是否清除所有缓存？用户信息将会保留，不会注销登录。",
      confirmColor: "#e74c3c",
      success: (res) => {
        if (!res.confirm) return;
        const userData = userManager.getFromCache();
        Taro.clearStorageSync();
        if (userData) {
          userManager.saveToCache();
        }
        // 恢复设置项
        Taro.setStorageSync(STORAGE_KEY_FORCE, forceUpdate);
        toggleDarkMode(darkMode);
        Taro.showToast({ title: "缓存已清除", icon: "success" });
      },
    });
  };

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.switchTab({ url: "/pages/user/index" })}
        />
        <HeadStatus text="设置" />
      </View>

      <View className="settings-content">
        <View className="settings-group">
          <View className="settings-row" onClick={handleDarkMode}>
            <View className="settings-row-left">
              <Text className="settings-label">黑夜模式</Text>
              <Text className="settings-desc">开启后应用主题变为深色</Text>
            </View>
            <View className="settings-row-right">
              {darkLoading && (
                <AtActivityIndicator isOpened size={24} mode="center" />
              )}
              <View
                className={`custom-switch ${darkMode ? "custom-switch-on" : "custom-switch-off"}`}
              >
                <View
                  className={`custom-switch-thumb ${darkMode ? "custom-switch-thumb-on" : "custom-switch-thumb-off"}`}
                />
              </View>
            </View>
          </View>

          <View className="settings-row" onClick={handleForceUpdate}>
            <View className="settings-row-left">
              <Text className="settings-label">数据更新</Text>
              <Text className="settings-desc">开启后每次启动强制刷新数据</Text>
            </View>
            <View className="settings-row-right">
              {forceLoading && (
                <AtActivityIndicator isOpened size={24} mode="center" />
              )}
              <View
                className={`custom-switch ${forceUpdate ? "custom-switch-on" : "custom-switch-off"}`}
              >
                <View
                  className={`custom-switch-thumb ${forceUpdate ? "custom-switch-thumb-on" : "custom-switch-thumb-off"}`}
                />
              </View>
            </View>
          </View>
        </View>

        <View className="settings-group">
          <View className="settings-row clear-cache-row" onClick={handleClearCache}>
            <Text className="clear-cache-text">清除缓存</Text>
            <AtIcon value="chevron-right" size="14" color="#e74c3c" />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
