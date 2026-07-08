// src/service/autoLogin.js
// 应用启动时自动检测登录状态，若 cookie 过期则自动重新登录
import Taro from '@tarojs/taro';
import useUserStore from '../store/useUserStore';
import { hbutCookies } from '../utils/platform/request';
import { decryptPassword } from '../utils/business/hbut/passwordStorage';
import userManager from './userInfo';
import { getSchool } from './router';
import runtimeLogger from '../utils/common/runtimeLogger';

export async function checkAndAutoLogin() {
  const { autoLoginEnabled, savedPassword } = useUserStore.getState();

  // 未开启自动登录或无保存的密码，跳过
  if (!autoLoginEnabled || !savedPassword) {
    runtimeLogger.info('AutoLogin', '自动登录未开启或无保存密码，跳过');
    return;
  }

  try {
    // Step 1: 检查 cookie 是否有效
    runtimeLogger.info('AutoLogin', '检查 cookie 有效性...');
    const school = getSchool();
    const stuInfo = await school.getStuInfo();
    if (stuInfo) {
      // cookie 有效，用户已登录
      userManager.setFields(stuInfo);
      userManager.setField('isLoggedIn', true);
      runtimeLogger.info('AutoLogin', 'cookie 有效，自动登录成功');
      return;
    }
  } catch {
    // cookie 失效，需要重新登录
    runtimeLogger.info('AutoLogin', 'cookie 已过期，开始重新登录...');
  }

  try {
    // Step 2: 清除过期 cookie
    hbutCookies.clear();

    // Step 3: 解密密码
    const plainPassword = decryptPassword(savedPassword);
    if (!plainPassword) {
      Taro.showToast({ title: '自动登录失败，请手动登录', icon: 'none' });
      useUserStore.getState().setAutoLogin(false);
      useUserStore.getState().setSavedPassword('');
      return;
    }
    // auth() 从 userManager.getAccount() 读取密码（内存字段），
    // 应用重启后内存为空，需要先写入解密后的密码
    userManager.setField('password', plainPassword);

    // Step 4: 重新登录
    const school = getSchool();
    const authRes = await school.auth();
    if (!authRes || !authRes.success) {
      throw new Error(authRes?.message || '登录失败');
    }

    // Step 5: 获取用户信息
    const stuInfo = await school.getStuInfo();
    if (!stuInfo) {
      throw new Error('获取用户信息失败');
    }

    userManager.setFields(stuInfo);
    userManager.setField('isLoggedIn', true);
    runtimeLogger.info('AutoLogin', '重新登录成功');
  } catch (err) {
    runtimeLogger.error('AutoLogin', '自动登录失败', err?.message || err);
    // 登录失败（密码错误等）清除自动登录状态，避免每次启动都弹 toast
    useUserStore.getState().setAutoLogin(false);
    useUserStore.getState().setSavedPassword('');
    Taro.showToast({ title: '自动登录失败，请手动登录', icon: 'none', duration: 2000 });
  }
}
