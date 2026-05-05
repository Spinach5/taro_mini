import Taro from '@tarojs/taro'
import cacheManager from './cache'   // 导入 CacheManager 实例（默认无前缀，或自定义）

class LoginManager {
  constructor() {
    this.account = ''
    this.password = ''
	this.name = ''
	this.school = ''
    this.islogin = false
    this.cacheKey = 'login'        // 缓存 key
	this._syncCache = null          // 缓存同步标识（用于判断是否需要同步缓存）
  }
    // 保存到缓存（使用 CacheManager，永不过期）
	saveToCache(values) {
	  // 第三个参数传 null 表示永不过期（或省略，默认 null）
	  cacheManager.set(this.cacheKey, values, null)
	}

	// 从缓存读取（使用 CacheManager）
	getFromCache() {
	  return cacheManager.get(this.cacheKey)  // 如果没有或过期会返回 null
	}

	getLoginInfoSync() {
		if (this._syncCache) {
		  return this._syncCache
		}
		// 尝试从缓存同步读取
		const cached = cacheManager.get(this.cacheKey)
		if (cached && typeof cached === 'object') {
		  const { account, password, name, school } = cached
		  this._syncCache = { account, password, name, school }
		  return { account, password, name, school }
		}
		// 返回默认值
		return { account: '', password: '',name:'',school:'' }
	  }
}

