// utils/request.weapp.js
import Taro from '@tarojs/taro'
import { API_BASE } from '../config/api'
import CookiesManager from './cookies'
import runtimeLogger from './runtimeLogger'

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

  // 保存 Set-Cookie
  const setCookieHeader = res.header['Set-Cookie'] || res.header['set-cookie']
  if (setCookieHeader) {
    const cookieHeaders = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]
    cookieHeaders.forEach(header => {
      cookieManager.parseAndMerge(header)
    })
  }

  // 手动处理重定向
  if (res.statusCode >= 300 && res.statusCode < 400 && res.statusCode !== 304) {
    const location = res.header.Location || res.header.location
    if (location && redirectCount < 5) {
      const redirectUrl = resolveUrl(fullUrl, location)
      // 重定向后转为 GET 并清空 body
      return requestCore(redirectUrl, 'GET', null, {}, baseURL, cookieManager, redirectCount + 1)
    } else if (redirectCount >= 5) {
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
