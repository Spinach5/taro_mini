import Taro from '@tarojs/taro'
import { encryptByAES } from './xxt' 
import { API_BASE } from '../config/api'
import { request } from './request'


export async function login() {
  // 1. 获取 AES 密钥 - 直接使用 Taro.request
  let aeskey = 'u2oh6Vu^HWe4_AES'
  try {
  const res = await request({
    url: `${API_BASE.passportStatic}/js/fanya/login.js`,
    method: 'GET',
    header: {
      Referer: 'https://i.chaoxing.com'
    }
  })
  console.log('获取密钥响应状态:', res.statusCode)
  console.log('获取密钥响应数据:', res.data)
  
  if (res.data && typeof res.data === 'string') {
    const match = res.data.match(/var transferKey\s*=\s*"([^"]+)"/)
    if (match) aeskey = match[1]
    console.log('AES 密钥:', aeskey)
  }
} catch (e) {
  console.log('获取密钥失败:', e)
}
  // // 2. 加密
  // const encodedUser = encryptByAES(username, aeskey)
  // const encodedPass = encryptByAES(password, aeskey)
  // console.log('加密完成')

  // // 3. 登录请求
  // const loginUrl = `${API_BASE.passport}/fanyalogin`
  // console.log('登录URL:', loginUrl)
  
  // const loginRes = await request(loginUrl, {
  //   method: 'POST',
  //   data: {
  //     uname: encodedUser,
  //     password: encodedPass,
  //     refer: 'https%3A%2F%2Fi.chaoxing.com',
  //     t: 'true'
  //   },
  //   headers: {
  //     'Content-Type': 'application/x-www-form-urlencoded',
  //     Referer: 'https://passport2.chaoxing.com/login'
  //   }
  // })

  // console.log('=== 登录响应详情 ===')
  // console.log('响应状态码:', loginRes?.statusCode)
  // console.log('响应数据类型:', typeof loginRes?.data)
  // console.log('响应数据:', loginRes?.data)

  // // 检查响应
  // if (!loginRes) {
  //   console.error('请求无响应')
  //   return false
  // }

  // if (loginRes.statusCode !== 200) {
  //   console.error('HTTP 状态码错误:', loginRes.statusCode)
  //   return false
  // }

  // let responseData = loginRes.data
  
  // // 如果是字符串，尝试解析 JSON
  // if (typeof responseData === 'string') {
  //   console.log('响应是字符串，长度:', responseData.length)
  //   console.log('响应内容预览:', responseData.substring(0, 200))
  //   try {
  //     responseData = JSON.parse(responseData)
  //     console.log('JSON 解析成功:', responseData)
  //   } catch (e) {
  //     console.log('不是 JSON 格式，可能是 HTML')
  //     // 如果是 HTML，可能登录失败，检查是否包含错误信息
  //     if (responseData.includes('登录失败') || responseData.includes('用户名或密码错误')) {
  //       console.error('登录失败: 用户名或密码错误')
  //       return false
  //     }
  //   }
  // }

  // if (!responseData || !responseData.status) {
  //   console.error('登录失败，响应数据:', responseData)
  //   return false
  // }

  // const realUrl = decodeURIComponent(responseData.url)
  // console.log('登录成功，跳转URL:', realUrl)

  // // 4. 同步主域 Cookie
  // try {
  //   console.log('[1] 访问跳转URL同步 Cookie...')
  //   await request(realUrl, { headers: { Referer: 'https://passport2.chaoxing.com/login' } })

  //   console.log('[2] 访问个人空间...')
  //   await request('https://i.chaoxing.com/base', { headers: { Referer: 'https://i.chaoxing.com' } })

  //   console.log('[3] SSO 跳转获取 mitudz...')
  //   const authUrl = 'https://vkb.jw.chaoxing.com/admin/api/xxtlogin?loginUrl=https%3A%2F%2Fhbut.jw.chaoxing.com%2Fadmin%2Flogin2%3Frole%3Dxs%26url%3Dhttps%253A%252F%252Fmitudz.jw.chaoxing.com%252Fviews%252FhomePage.html%253Frole%253D1%2526domainUrl%253Dhbut.jw.chaoxing.com'
  //   await request(authUrl, { headers: { Referer: 'https://i.chaoxing.com/base' } })

  //   console.log('登录完成，Cookie 已保存')
  //   return true
  // } catch (err) {
  //   console.error('同步 Cookie 失败:', err)
  //   return false
  // }
}