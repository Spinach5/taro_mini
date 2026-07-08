// src/utils/business/hbut/passwordStorage.js
// 使用 AES 对称加密保存/恢复用户密码，用于自动登录
import CryptoJS from 'crypto-js';

// 混淆后的固定密钥（仅用于本地存储，非教务系统加密）
const SECRET_KEY = 'dunzaiji2024hbut@)!&';

export function encryptPassword(plain) {
  if (!plain) return '';
  return CryptoJS.AES.encrypt(plain, SECRET_KEY).toString();
}

export function decryptPassword(cipher) {
  if (!cipher) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || '';
  } catch {
    return '';
  }
}
