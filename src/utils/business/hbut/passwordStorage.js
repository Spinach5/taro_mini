// src/utils/business/hbut/passwordStorage.js
// 使用 AES 对称加密保存/恢复用户密码，用于自动登录
// 使用确定性 key/IV 模式，避免微信小程序缺少 crypto.getRandomValues 的问题
//
// 自动登录状态使用独立的 storage key 直接读写，绕过 zustand persist
// 避免 login()→logout()→clearStorageSync()→setState 反复擦写导致数据丢失
import CryptoJS from 'crypto-js';
import Taro from '@tarojs/taro';

// 混淆后的固定密钥（仅用于本地存储，非教务系统加密）
const SECRET_KEY = 'dunzaiji2024hbut@)!&';
const STORAGE_KEY = 'autoLoginCreds';

// 从 SECRET_KEY 确定性派生 key 和 IV（不依赖随机数，兼容微信小程序）
const key = CryptoJS.enc.Hex.parse(CryptoJS.MD5(SECRET_KEY).toString());
const iv = CryptoJS.enc.Hex.parse(CryptoJS.MD5(SECRET_KEY + 'iv').toString());

export function encryptPassword(plain) {
  if (!plain) return '';
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

/** 保存自动登录凭证（直接写 storage，绕过 zustand） */
export function saveAutoLoginCreds(enabled, encryptedPassword) {
  try {
    Taro.setStorageSync(STORAGE_KEY, { enabled, encryptedPassword });
  } catch { /* ignore */ }
}

/** 读取自动登录凭证 */
export function getAutoLoginCreds() {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY);
    if (data && typeof data === 'object') {
      return { enabled: !!data.enabled, encryptedPassword: data.encryptedPassword || '' };
    }
  } catch { /* ignore */ }
  return { enabled: false, encryptedPassword: '' };
}

/** 清除自动登录凭证 */
export function clearAutoLoginCreds() {
  try {
    Taro.removeStorageSync(STORAGE_KEY);
  } catch { /* ignore */ }
}
