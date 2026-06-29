import { createContext, useContext } from "react";
import useThemeStore from "../store/useThemeStore";

/**
 * 向后兼容的 ThemeProvider
 * 内部委托给 zustand useThemeStore，保持原有 API 不变
 */
const ThemeContext = createContext({
  darkMode: false,
  toggleDarkMode: () => {},
});

export function ThemeProvider({ children }) {
  const darkMode = useThemeStore((s) => s.darkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function isForceUpdate() {
  try {
    const Taro = require("@tarojs/taro").default;
    return !!Taro.getStorageSync("settings_force_update");
  } catch {
    return false;
  }
}
