import { useState, useEffect, useCallback } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import HeadStatus from "../../../components/HeadStatus";
import SafeAreaView from "../../../components/SafeAreaView";
import userManager from "../../../service/userInfo";
import { useTheme } from "../../../utils/theme";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import "./index.css";

const STORAGE_KEY_FORCE = "settings_force_update";
const STORAGE_KEY_FEATURES = "settings_feature_toggles";

const DEFAULT_FEATURES = {
  expand: false,
  club: false,
  food: false,
  book: false,
  other: false,
};

function getStoredForceUpdate() {
  try {
    return !!Taro.getStorageSync(STORAGE_KEY_FORCE);
  } catch {
    return false;
  }
}

function getStoredFeatures() {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY_FEATURES);
    if (stored && typeof stored === "object") {
      return { ...DEFAULT_FEATURES, ...stored };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_FEATURES };
}

function saveFeatures(features) {
  Taro.setStorageSync(STORAGE_KEY_FEATURES, features);
}

// 开关组件
function ToggleSwitch({ value, disabled, onClick }) {
  return (
    <View
      className={`custom-switch ${value ? "custom-switch-on" : "custom-switch-off"}${disabled ? " custom-switch-disabled" : ""}`}
      onClick={disabled ? undefined : onClick}
    >
      <View
        className={`custom-switch-thumb ${value ? "custom-switch-thumb-on" : "custom-switch-thumb-off"}`}
      />
    </View>
  );
}

export default function Index() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [forceUpdate, setForceUpdate] = useState(false);
  const [darkLoading, setDarkLoading] = useState(false);
  const [forceLoading, setForceLoading] = useState(false);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);

  useEffect(() => {
    setForceUpdate(getStoredForceUpdate());
    setFeatures(getStoredFeatures());
  }, []);

  const updateFeature = useCallback((key, value) => {
    setFeatures((prev) => {
      if (key === "expand") {
        const next = value
          ? { expand: true, club: prev.club, food: prev.food, book: prev.book, other: prev.other }
          : { expand: false, club: false, food: false, book: false, other: false };
        saveFeatures(next);
        return next;
      }
      const next = { ...prev, [key]: value };
      saveFeatures(next);
      return next;
    });
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
        Taro.setStorageSync(STORAGE_KEY_FEATURES, features);
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
          <View className="settings-row" onClick={() => updateFeature("expand", !features.expand)}>
            <View className="settings-row-left">
              <Text className="settings-label">拓展</Text>
              <Text className="settings-desc">开启后可在首页显示更多功能入口</Text>
            </View>
            <View className="settings-row-right">
              <ToggleSwitch value={features.expand} onClick={() => updateFeature("expand", !features.expand)} />
            </View>
          </View>

          <View className={`settings-row${features.expand ? "" : " settings-row-disabled"}`} onClick={() => features.expand && updateFeature("club", !features.club)}>
            <View className="settings-row-left">
              <Text className="settings-label">社团</Text>
              <Text className="settings-desc">首页显示社团入口</Text>
            </View>
            <View className="settings-row-right">
              <ToggleSwitch value={features.club} disabled={!features.expand} onClick={() => updateFeature("club", !features.club)} />
            </View>
          </View>

          <View className={`settings-row${features.expand ? "" : " settings-row-disabled"}`} onClick={() => features.expand && updateFeature("food", !features.food)}>
            <View className="settings-row-left">
              <Text className="settings-label">美食</Text>
              <Text className="settings-desc">首页显示美食入口</Text>
            </View>
            <View className="settings-row-right">
              <ToggleSwitch value={features.food} disabled={!features.expand} onClick={() => updateFeature("food", !features.food)} />
            </View>
          </View>

          <View className={`settings-row${features.expand ? "" : " settings-row-disabled"}`} onClick={() => features.expand && updateFeature("book", !features.book)}>
            <View className="settings-row-left">
              <Text className="settings-label">书籍</Text>
              <Text className="settings-desc">首页显示书籍入口</Text>
            </View>
            <View className="settings-row-right">
              <ToggleSwitch value={features.book} disabled={!features.expand} onClick={() => updateFeature("book", !features.book)} />
            </View>
          </View>

          <View className={`settings-row${features.expand ? "" : " settings-row-disabled"}`} onClick={() => features.expand && updateFeature("other", !features.other)}>
            <View className="settings-row-left">
              <Text className="settings-label">其他</Text>
              <Text className="settings-desc">首页显示其他入口</Text>
            </View>
            <View className="settings-row-right">
              <ToggleSwitch value={features.other} disabled={!features.expand} onClick={() => updateFeature("other", !features.other)} />
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
