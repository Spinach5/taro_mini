import Taro from '@tarojs/taro'
import cacheManager from './cache'

// 存储 Cookie 的 key
const COOKIE_KEY = 'app_cookies'

// 获取存储的 Cookie 对象
export function getCookieObject() {
  try {
    const cookies = cacheManager.get(COOKIE_KEY)
    // 如果缓存值为 null 或非对象，则返回空对象
    return (cookies && typeof cookies === 'object') ? cookies : {}
  } catch (e) {
    return {}
  }
}

// 保存 Cookie 对象
export function setCookieObject(cookies) {
  try {
    cacheManager.set(COOKIE_KEY, cookies)
  } catch (e) {}
}

// 从响应头中解析 Set-Cookie，合并到现有 Cookie
export function mergeCookiesFromResponse(res) {
  const setCookieHeader = res.header['Set-Cookie'] || res.header['set-cookie']
  if (!setCookieHeader) return

  let cookieStr = ''
  if (typeof setCookieHeader === 'string') cookieStr = setCookieHeader
  else if (Array.isArray(setCookieHeader)) cookieStr = setCookieHeader.join(';')

  // 简单解析 key=value（忽略 path、expires 等）
  const cookies = getCookieObject()
  const pairs = cookieStr.split(/,(?=[^,]*=)/)
  pairs.forEach(pair => {
    const match = pair.match(/([^=]+)=([^;]+)/)
    if (match) {
      cookies[match[1].trim()] = match[2].trim()
    }
  })
  setCookieObject(cookies)
}

// 构建请求头中的 Cookie 字符串
export function buildCookieHeader() {
  const cookies = getCookieObject()
  // 如果没有 Cookie 字段，返回空字符串
  if (Object.keys(cookies).length === 0) return ''
  return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
}

// 封装的请求方法，自动携带并保存 Cookie
export async function request(options) {
  const { url, method = 'GET', data, header = {}, ...rest } = options

  const requestHeader = {
    'Content-Type': 'application/x-www-form-urlencoded',
    ...header,
  }
  const cookieStr = buildCookieHeader()
  if (cookieStr) {
    requestHeader['Cookie'] = cookieStr
  }

  const res = await Taro.request({
    url,
    method,
    data,
    header: requestHeader,
    ...rest,
  })

  // 保存响应的 Cookie
  mergeCookiesFromResponse(res)

  return res
}
