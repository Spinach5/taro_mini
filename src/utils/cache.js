import Taro from '@tarojs/taro'

class CacheManager {
  constructor(prefix = 'app_') {
    this.prefix = prefix
  }

  // 生成完整 key
  getKey(key) {
    return `${this.prefix}${key}`
  }

  // 设置缓存（同步）
  set(key, value, expireTime = null) {
    try {
      const cacheData = {
        data: value,
        timestamp: Date.now(),
        expireTime: expireTime
      }
      Taro.setStorageSync(this.getKey(key), cacheData)
      return true
    } catch (error) {
      console.error('设置缓存失败:', error)
      return false
    }
  }

  // 获取缓存（同步）
  get(key) {
    try {
      const cacheData = Taro.getStorageSync(this.getKey(key))
      
      if (!cacheData) return null
      
      // 检查是否过期
      if (cacheData.expireTime) {
        const now = Date.now()
        if (now - cacheData.timestamp > cacheData.expireTime) {
          this.remove(key)
          return null
        }
      }
      
      return cacheData.data
      
    } catch (error) {
      console.error('获取缓存失败:', error)
      return null
    }
  }

  // 异步设置
  async setAsync(key, value, expireTime = null) {
    try {
      const cacheData = {
        data: value,
        timestamp: Date.now(),
        expireTime: expireTime
      }
      await Taro.setStorage({ key: this.getKey(key), data: cacheData })
      return true
    } catch (error) {
      console.error('异步设置缓存失败:', error)
      return false
    }
  }

  // 异步获取
  async getAsync(key) {
    try {
      const res = await Taro.getStorage({ key: this.getKey(key) })
      const cacheData = res.data
      
      if (!cacheData) return null
      
      // 检查是否过期
      if (cacheData.expireTime) {
        const now = Date.now()
        if (now - cacheData.timestamp > cacheData.expireTime) {
          await this.removeAsync(key)
          return null
        }
      }
      
      return cacheData.data
      
    } catch (error) {
      console.error('异步获取缓存失败:', error)
      return null
    }
  }

  // 删除缓存
  remove(key) {
    try {
      Taro.removeStorageSync(this.getKey(key))
      return true
    } catch (error) {
      console.error('删除缓存失败:', error)
      return false
    }
  }

  // 异步删除
  async removeAsync(key) {
    try {
      await Taro.removeStorage({ key: this.getKey(key) })
      return true
    } catch (error) {
      console.error('异步删除缓存失败:', error)
      return false
    }
  }

  // 清空所有缓存
  clear() {
    try {
      Taro.clearStorageSync()
      return true
    } catch (error) {
      console.error('清空缓存失败:', error)
      return false
    }
  }
}

export default new CacheManager()