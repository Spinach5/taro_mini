import cacheManager from './cache' // 全局唯一的缓存管理器
import { parseCookiesToKeyValue, stringifyCookieObj } from './rex'

/**
 * Cookie 管理器
 * - 可通过不同 prefix 创建多个实例，对应缓存中不同的 key
 * - 内部自动从缓存加载、修改后写回缓存（永不过期）
 */
class CookiesManager {
  /**
   * @param {string} prefix 用于生成缓存键的前缀，区分不同的 cookie 集合
   */
  constructor(prefix = '') {
    this.prefix = prefix
    this.cacheKey = `cookies_${prefix}` // 缓存键，例如 "cookies_" 或 "cookies_user"
    this.cookies = {}                   // 内存中的 cookie 对象（与缓存同步）
    this._loadFromCache()               // 初始化时立即从缓存加载
  }

  /** 从缓存读取并解析到内存 */
  _loadFromCache() {
    const cached = cacheManager.get(this.cacheKey)
    if (cached && typeof cached === 'object') {
      this.cookies = { ...cached }
    } else {
      this.cookies = {}
    }
  }

  /** 将当前内存对象持久化到缓存，永不过期 */
  _saveToCache() {
    cacheManager.set(this.cacheKey, this.cookies, null)
  }

  // ---------- 公共 API ----------
  /**
   * 获取当前所有 cookie 的浅拷贝
   * @returns {object}
   */
  getAll() {
    return { ...this.cookies }
  }

  /**
   * 获取指定 cookie 的值
   * @param {string} name
   * @returns {string|undefined}
   */
  get(name) {
    return this.cookies.hasOwnProperty(name) ? this.cookies[name] : undefined
  }

  /**
   * 设置一个 cookie
   * @param {string} name
   * @param {string|number} value
   * @returns {this} 支持链式调用
   */
  set(name, value) {
    this.cookies[name] = String(value)
    this._saveToCache()
    return this
  }

  /**
   * 批量设置 cookie（合并方式）
   * @param {object} obj - 键值对
   * @returns {this}
   */
  setAll(obj) {
    for (const [key, val] of Object.entries(obj)) {
      this.cookies[key] = String(val)
    }
    this._saveToCache()
    return this
  }

  /**
   * 删除一个 cookie
   * @param {string} name
   * @returns {this}
   */
  remove(name) {
    if (this.cookies.hasOwnProperty(name)) {
      delete this.cookies[name]
      this._saveToCache()
    }
    return this
  }

  /**
   * 清空所有 cookie
   * @returns {this}
   */
  clear() {
    this.cookies = {}
    this._saveToCache()
    return this
  }

  /**
   * 将标准 cookie 字符串解析并合并到当前集合（使用 rex 的 parse）
   * 例如从响应头 Set-Cookie 处获取的字符串
   * @param {string} cookieStr
   * @returns {this}
   */
  parseAndMerge(cookieStr) {
    const parsed = parseCookiesToKeyValue(cookieStr)
    this.setAll(parsed)
    return this
  }

  /**
   * 将当前 cookie 集合序列化为请求头字符串（使用 rex 的 stringify）
   * 格式："key1=val1; key2=val2"
   * @returns {string}
   */
  toString() {
    return stringifyCookieObj(this.cookies)
  }

}

export default CookiesManager
