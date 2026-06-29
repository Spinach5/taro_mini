import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import taroStorage from './storage';

const useSettingsStore = create(
  persist(
    (set) => ({
      featureToggles: {},
      forceUpdate: false,

      setFeatureToggle: (key, value) =>
        set((state) => ({
          featureToggles: { ...state.featureToggles, [key]: value },
        })),

      setForceUpdate: (value) => set({ forceUpdate: value }),
    }),
    {
      name: 'settings-store',
      storage: taroStorage,
    },
  ),
);

export default useSettingsStore;
