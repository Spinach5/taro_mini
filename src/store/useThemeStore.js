import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Taro from '@tarojs/taro';
import taroStorage from './storage';

const useThemeStore = create(
  persist(
    (set) => ({
      darkMode: false,

      toggleDarkMode: (value) => {
        set((state) => {
          const newValue = value !== undefined ? value : !state.darkMode;

          // 应用主题副作用
          try {
            if (process.env.TARO_ENV === 'h5') {
              document.body.setAttribute('data-theme', newValue ? 'dark' : 'light');
            }
            if (process.env.TARO_ENV === 'weapp') {
              Taro.setNavigationBarColor({
                frontColor: newValue ? '#ffffff' : '#000000',
                backgroundColor: newValue ? '#1a1a2e' : '#ffffff',
              });
              Taro.setBackgroundColor({
                backgroundColor: newValue ? '#1a1a2e' : '#ffffff',
              });
            }
          } catch (e) {
            console.error('[useThemeStore] toggleDarkMode error:', e);
          }

          return { darkMode: newValue };
        });
      },
    }),
    {
      name: 'theme-store',
      storage: taroStorage,
      partialize: (state) => ({ darkMode: state.darkMode }),
    },
  ),
);

export default useThemeStore;
