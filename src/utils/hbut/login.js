// login.js
import { hbutRequest } from '../request'
import encryptPassword from './loginEncrypt'

export async function login(stuID, password) {
  let encodedPassword
  try {
    encodedPassword = encryptPassword(password)
    if (!encodedPassword) {
      console.error('密码加密失败')
      return false
    }
  } catch (e) {
    console.error(`加密异常: ${e.message}`)
    return false
  }

  const params = new URLSearchParams()
  params.append('username', stuID)
  params.append('password', encodedPassword)
  params.append('rememberMe', '1')
  params.append('vcode', '')
  params.append('jcaptchaCode', '')

  const loginConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: 'https://jwxt.hbut.edu.cn',
      Origin: 'https://jwxt.hbut.edu.cn',
    },
    dataType: 'text',      // 期望返回 HTML
    // 小程序端不需要 withCredentials（已由底层处理），H5 端会保留 withCredentials: true
    withCredentials: process.env.TARO_ENV === 'h5',
  }

  const response = await hbutRequest.post('/admin/login', params, loginConfig)

  // 判断登录是否成功（两种环境通用）
  const response2 = await hbutRequest.post('/admin/xsd/xssqcxbm/checkCbxTime',new URLSearchParams(),loginConfig)
  //   if (html.indexOf('用户名或密码错误') || html.indexOf('验证码')) {
//     console.error('登录失败：用户名或密码错误/验证码')
//     return false
//   }

//   // 额外检查：如果响应中包含退出字样，通常表示登录成功
//   if (html.indexOf('退出') || html.indexOf('教务管理系统')) {
//     console.log('登录成功')
//     return true
//   }

  console.warn('可能登录成功，但未检测到明确标识')
  return true
}
