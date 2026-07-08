// src/utils/business/hbut/passwordStorage.js
// 使用 AES 对称加密保存/恢复用户密码，用于自动登录
// 使用确定性 key/IV 模式，避免微信小程序缺少 crypto.getRandomValues 的问题
import CryptoJS from 'crypto-js';

// 混淆后的固定密钥（仅用于本地存储，非教务系统加密）
const SECRET_KEY = 'dunzaiji2024hbut@)!&';

// 从 SECRET_KEY 确定性派生 key 和 IV（不依赖随机数，兼容微信小程序）
const key = CryptoJS.enc.Hex.parse(CryptoJS.MD5(SECRET_KEY).toString());
const iv = CryptoJS.enc.Hex.parse(CryptoJS.MD5(SECRET_KEY + 'iv').toString());

export function encryptPassword(plain) {
  if (!plain) return '';
  // 使用显式 key/iv，避免 passphrase 模式内部调用 crypto.getRandomValues
  return CryptoJS.AES.encrypt(plain, key, { iv }).toString();
}

export function decryptPassword(cipher) {
  if (!cipher) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, key, { iv });
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || '';
  } catch {
    return '';
  }
}
