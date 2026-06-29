import cacheManager from '../utils/common/cache';

/**
 * zustand persist storage 适配层
 * 将 CacheManager 适配为 zustand persist 中间件需要的 storage API
 */
export const taroStorage = {
  getItem: (name) => {
    const value = cacheManager.get(name);
    return value === null ? null : JSON.stringify(value);
  },
  setItem: (name, value) => {
    try {
      const parsed = JSON.parse(value);
      cacheManager.set(name, parsed);
    } catch {
      cacheManager.set(name, value);
    }
  },
  removeItem: (name) => {
    cacheManager.remove(name);
  },
};

export default taroStorage;
