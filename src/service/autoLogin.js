// src/service/autoLogin.js
// 应用启动时自动检测登录状态，若 cookie 过期则自动重新登录
import Taro from '@tarojs/taro';
import useUserStore from '../store/useUserStore';
import { hbutCookies } from '../utils/platform/request';
import { decryptPassword, getAutoLoginCreds, clearAutoLoginCreds } from '../utils/business/hbut/passwordStorage';
import userManager from './userInfo';
import { getSchool } from './router';
import runtimeLogger from '../utils/common/runtimeLogger';

export async function checkAndAutoLogin() {
  // 直接从 storage 读取自动登录凭证（绕过 zustand，避免 persist 时序问题）
  const { enabled, encryptedPassword } = getAutoLoginCreds();
  runtimeLogger.info('AutoLogin', `自动登录${enabled ? '已' : '未'}开启, 密码${encryptedPassword ? '已' : '未'}保存`);

  if (!enabled || !encryptedPassword) {
    return;
  }

  try {
    // Step 1: 检查 cookie 是否有效
    runtimeLogger.info('AutoLogin', '检查 cookie 有效性...');
    const school = getSchool();
    const stuInfo = await school.getStuInfo({ forceRefresh: true });
    if (stuInfo) {
      userManager.setFields(stuInfo);
      // getStuInfo 不包含 university，保持已有值或兜底
      if (!useUserStore.getState().university) {
        userManager.setField('university', '湖北工业大学');
      }
      userManager.setField('isLoggedIn', true);
      runtimeLogger.info('AutoLogin', 'cookie 有效，自动登录成功');
      return;
    }
  } catch {
    runtimeLogger.info('AutoLogin', 'cookie 已过期，开始重新登录...');
  }

  try {
    hbutCookies.clear();

    // Step 2: 解密密码
    const plainPassword = decryptPassword(encryptedPassword);
    if (!plainPassword) {
      Taro.showToast({ title: '自动登录失败，请手动登录', icon: 'none' });
      clearAutoLoginCreds();
      return;
    }
    userManager.setField('password', plainPassword);

    // Step 3: 重新登录
    const school = getSchool();
    const authRes = await school.auth();
    if (!authRes || !authRes.success) {
      throw new Error(authRes?.message || '登录失败');
    }

    // Step 4: 获取用户信息
    const stuInfo = await school.getStuInfo();
    if (!stuInfo) {
      throw new Error('获取用户信息失败');
    }

    userManager.setFields(stuInfo);
    // getStuInfo 不包含 university，保持已有值或兜底
    if (!useUserStore.getState().university) {
      userManager.setField('university', '湖北工业大学');
    }
    userManager.setField('isLoggedIn', true);
    runtimeLogger.info('AutoLogin', '重新登录成功');
  } catch (err) {
    runtimeLogger.error('AutoLogin', '自动登录失败', err?.message || err);
    clearAutoLoginCreds();
    Taro.showToast({ title: '自动登录失败，请手动登录', icon: 'none', duration: 2000 });
  }
}
