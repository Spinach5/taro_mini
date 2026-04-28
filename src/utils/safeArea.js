import Taro from '@tarojs/taro'

class SafeAreaManager {
  constructor() {
    this.safeAreaTop = 44
    this.safeAreaBottom = 34
    this.statusBarHeight = 44
    this.isReady = false
    this.cacheKey = 'safe_area_cache'
    this._syncCache = null // 同步缓存值
  }

  // 初始化，返回 Promise
  async init(forceRefresh = false) {
    if (this.isReady && !forceRefresh) {
      return this.getValues()
    }

    // 1. 尝试从本地缓存读取
    const cached = this.getFromCache()
    if (cached && !forceRefresh) {
      this.applyValues(cached)
      this.setCSSVariables()
      this._syncCache = { top: this.safeAreaTop, bottom: this.safeAreaBottom }
      console.log('使用缓存的安全距离:', cached)
      return this.getValues()
    }

    // 2. 获取系统信息
    try {
      const res = await Taro.getSystemInfo({})
      const { safeArea, statusBarHeight, screenHeight } = res

      let top, bottom
      if (safeArea) {
        top = safeArea.top || 44
        bottom = screenHeight - safeArea.bottom || 0
      } else {
        top = statusBarHeight || 44
        bottom = 0
      }

      const values = {
        top,
        bottom,
        statusBarHeight: statusBarHeight || 44,
        left: safeArea?.left || 0,
        right: safeArea?.right || 0,
      }

      this.applyValues(values)
      this.saveToCache(values)
      this.setCSSVariables()
      this.isReady = true
      this._syncCache = { top, bottom }

      console.log('安全距离获取成功:', values)
      return this.getValues()
    } catch (error) {
      console.error('获取安全距离失败，使用默认值:', error)
      const defaultValues = {
        top: 44,
        bottom: 34,
        statusBarHeight: 44,
        left: 0,
        right: 0,
      }
      this.applyValues(defaultValues)
      this.setCSSVariables()
      this.isReady = true
      this._syncCache = { top: defaultValues.top, bottom: defaultValues.bottom }
      return this.getValues()
    }
  }

  // ✅ 同步获取安全距离（优先从实例属性，若不 ready 则尝试读缓存或返回默认）
  getSafeAreaSync() {
    if (this._syncCache) {
      return this._syncCache
    }

    // 尝试从缓存同步读取
    try {
      const cache = Taro.getStorageSync(this.cacheKey)
      if (cache && cache.data) {
        const { top, bottom } = cache.data
        this._syncCache = { top, bottom }
        return { top, bottom }
      }
    } catch (e) {
      // ignore
    }

    // 返回默认值
    return { top: 44, bottom: 34 }
  }

  // 保存到本地缓存（24小时过期）
  saveToCache(values) {
    try {
      const cacheData = {
        data: values,
        timestamp: Date.now(),
      }
      Taro.setStorageSync(this.cacheKey, cacheData)
    } catch (e) {
      console.warn('缓存安全距离失败', e)
    }
  }

  // 从缓存读取（检查是否过期）
  getFromCache() {
    try {
      const cache = Taro.getStorageSync(this.cacheKey)
      if (!cache) return null
      const now = Date.now()
      if (now - cache.timestamp > 24 * 60 * 60 * 1000) {
        Taro.removeStorageSync(this.cacheKey)
        return null
      }
      return cache.data
    } catch (e) {
      return null
    }
  }

  // 应用数值到实例属性
  applyValues(values) {
    this.safeAreaTop = values.top
    this.safeAreaBottom = values.bottom
    this.statusBarHeight = values.statusBarHeight
    this.safeAreaLeft = values.left || 0
    this.safeAreaRight = values.right || 0
  }

  // 设置 CSS 变量（仅在 H5 环境有效）
  setCSSVariables() {
    if (process.env.TARO_ENV === 'h5' && typeof document !== 'undefined') {
      const root = document.documentElement
      root.style.setProperty('--safe-area-top', `${this.safeAreaTop}px`)
      root.style.setProperty('--safe-area-bottom', `${this.safeAreaBottom}px`)
      root.style.setProperty('--status-bar-height', `${this.statusBarHeight}px`)
    }
  }

  // 获取当前值
  getValues() {
    return {
      top: this.safeAreaTop,
      bottom: this.safeAreaBottom,
      left: this.safeAreaLeft,
      right: this.safeAreaRight,
      statusBarHeight: this.statusBarHeight,
      isReady: this.isReady,
    }
  }
}

// 导出单例
const safeAreaManager = new SafeAreaManager()
export default safeAreaManager

// ✅ 导出一个便捷的同步获取函数，页面可以直接调用
export const getSafeArea = () => safeAreaManager.getSafeAreaSync()