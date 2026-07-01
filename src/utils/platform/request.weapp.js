// utils/request.weapp.js
import Taro from '@tarojs/taro'
import { API_BASE } from '../../config/api'
import CookiesManager from '../common/cookies'
import runtimeLogger from '../common/runtimeLogger'

/**
 * 拼接完整 URL
 */
function resolveUrl(base, relative) {
  if (relative.startsWith('http')) return relative
  const baseClean = base.replace(/\/$/, '')
  const relClean = relative.replace(/^\//, '')
  return `${baseClean}/${relClean}`
}

/**
 * 核心请求函数（带手动重定向和 Cookie 自动管理）
 * @param {CookiesManager} cookieManager Cookie管理器实例
 */
async function requestCore(url, method, data, headers, baseURL, cookieManager, redirectCount = 0) {
  const fullUrl = resolveUrl(baseURL, url)

  // 自动携带已保存的 Cookie
  const cookieString = cookieManager.toString()
  if (cookieString) {
    headers['Cookie'] = cookieString
  }

  // 处理 form-urlencoded 数据
  let requestData = data
  const contentType = headers['Content-Type'] || ''
  if (contentType.indexOf('application/x-www-form-urlencoded') !== -1 && data && typeof data !== 'string') {
    if (typeof data.toString === 'function' && data.toString !== Object.prototype.toString) {
      requestData = data.toString()
    } else if (typeof data === 'object') {
      requestData = Object.entries(data)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
    }
  }

  const res = await Taro.request({
    url: fullUrl,
    method,
    data: requestData,
    header: headers,
    redirect: 'manual',
  })

  // 保存 Set-Cookie（方式1：从响应头解析）
  let cookieSaved = false
  const setCookieHeader = res.header['Set-Cookie'] || res.header['set-cookie']
  if (setCookieHeader) {
    const cookieHeaders = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
    cookieHeaders.forEach(header => {
      cookieManager.parseAndMerge(header)
    })
    cookieSaved = true
  }

  // 保存 Cookie（方式2：Taro 4.x 的 res.cookies，包含重定向链中所有 cookie）
  if (res.cookies && Array.isArray(res.cookies)) {
    const cookieObj = {}
    res.cookies.forEach(c => {
      if (c.name && c.value) {
        cookieObj[c.name] = c.value
      }
    })
    if (Object.keys(cookieObj).length > 0) {
      cookieManager.setAll(cookieObj)
      cookieSaved = true
    }
  }

  // 调试：打印登录流程中的 cookie 状态
  if (url.indexOf('/admin/login') !== -1 || url.indexOf('/admin/xsd') !== -1) {
    console.log(`[Request] ${method} ${url} | status=${res.statusCode} | cookieSaved=${cookieSaved}`)
    console.log(`[Request] res.header keys:`, Object.keys(res.header || {}).join(', '))
    console.log(`[Request] res.cookies:`, JSON.stringify(res.cookies || []))
    console.log(`[Request] set-cookie header:`, setCookieHeader || '(none)')
    console.log(`[Request] cookies in manager:`, JSON.stringify(cookieManager.getAll()))
  }

  // 手动处理重定向（仅 GET 请求跟随，POST 的 302 返回给调用方处理）
  if (res.statusCode >= 300 && res.statusCode < 400 && res.statusCode !== 304 && method === 'GET') {
    const location = res.header.Location || res.header.location
    if (location && redirectCount < 10) {
      const redirectUrl = resolveUrl(fullUrl, location)
      return requestCore(redirectUrl, 'GET', null, {}, baseURL, cookieManager, redirectCount + 1)
    } else if (redirectCount >= 10) {
      throw new Error('重定向次数过多')
    }
  }

  return {
    data: res.data,
    status: res.statusCode,
    statusText: res.errMsg,
    headers: res.header,
    config: { url, method, data, headers, baseURL },
  }
}

/**
 * 创建请求实例
 * @param {string} baseURL 基础URL
 * @param {CookiesManager} cookieManager Cookie管理器实例
 */
function createRequest(baseURL, cookieManager) {

  const instance = {
    baseURL,
    async request(config) {
      const { url, method = 'GET', data, headers = {} } = config
      try {
        return await requestCore(url, method, data, headers, baseURL, cookieManager)
      } catch (error) {
        runtimeLogger.error('Request', `${method} ${url} 失败`, error)
        throw error
      }
    },
    get(url, config = {}) {
      return this.request({ ...config, url, method: 'GET' })
    },
    post(url, data, config = {}) {
      return this.request({ ...config, url, method: 'POST', data })
    },
    put(url, data, config = {}) {
      return this.request({ ...config, url, method: 'PUT', data })
    },
    delete(url, config = {}) {
      return this.request({ ...config, url, method: 'DELETE' })
    },
  }
  return instance
}

// 为不同后端创建独立的 Cookie 管理器实例（模块级，可供外部清除）
export const hbutCookies = new CookiesManager('hbut')
export const opendiffCookies = new CookiesManager('opendiff')
export const giteeCookies = new CookiesManager('gitee')
const defaultCookies = new CookiesManager('')

// 为 hbut 后端创建实例，使用 'hbut' 前缀
export const hbutRequest = createRequest(API_BASE.hbut, hbutCookies)
export const opendiffRequest = createRequest(API_BASE.opendiff, opendiffCookies)
export const giteeRequest = createRequest(API_BASE.gitee, giteeCookies)
export default createRequest('', defaultCookies)
