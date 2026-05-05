// src/utils/xxt.js
import CryptoJS from 'crypto-js'
import cacheManager from './cache'

// 初始化 key 变量（非 const）
let key = cacheManager.get('aeskey')
if (!key) {
  // 缓存不存在，设置默认密钥
  key = 'u2oh6Vu^HWe4_AES'
  cacheManager.set('aeskey', key)
}

export function encryptByAES(message) {
  const CBCOptions = {
    iv: CryptoJS.enc.Utf8.parse(key),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  }
  const aeskey = CryptoJS.enc.Utf8.parse(key)
  const secretData = CryptoJS.enc.Utf8.parse(message)
  const encrypted = CryptoJS.AES.encrypt(secretData, aeskey, CBCOptions)
  return CryptoJS.enc.Base64.stringify(encrypted.ciphertext)
}

export default { encryptByAES }
