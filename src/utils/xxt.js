// src/utils/xxt.js
import CryptoJS from 'crypto-js'

export function encryptByAES(message, key) {
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

// 如果有需要默认导出
export default { encryptByAES }