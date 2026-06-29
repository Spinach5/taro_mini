import { useState, useEffect, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import userManager from '../service/userInfo';

/**
 * 鉴权守卫 Hook
 * @param {Object} options - 配置项
 * @param {boolean} options.requireLogin - 是否需要登录，默认 true
 * @param {boolean} options.requireServerToken - 是否需要服务器 token，默认 false
 * @param {string} options.redirectTo - 未登录时跳转地址
 * @param {boolean} options.showPage - 鉴权失败是否显示页面（false 则返回 null）
 * @returns {Object} { authState, isAuthenticated, AuthGuard }
 */
export function useAuthGuard(options = {}) {
  const {
    requireLogin = true,
    requireServerToken = false,
    redirectTo = '/modules/pages/login/index',
    showPage = true,
  } = options;

  const [authState, setAuthState] = useState('checking');

  const checkAuth = useCallback(() => {
    if (requireLogin && !userManager.checkLogin()) {
      setAuthState('need-login');
      return false;
    }
    if (requireServerToken && !userManager.getServerToken()) {
      setAuthState('need-register');
      return false;
    }
    setAuthState('ok');
    return true;
  }, [requireLogin, requireServerToken]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const isAuthenticated = authState === 'ok';

  // AuthGuard 包裹组件
  const AuthGuard = useCallback(
    ({ children }) => {
      if (authState === 'checking') {
        return null; // 或者返回 loading 组件
      }

      if (authState === 'need-login') {
        if (!showPage) return null;
        return (
          <View style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '40rpx',
          }}>
            <Text style={{ fontSize: '28rpx', color: '#999' }}>请先登录</Text>
          </View>
        );
      }

      if (authState === 'need-register') {
        if (!showPage) return null;
        return (
          <View style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '40rpx',
          }}>
            <Text style={{ fontSize: '28rpx', color: '#999' }}>
              请先在设置中注册拓展功能
            </Text>
          </View>
        );
      }

      return children;
    },
    [authState, showPage],
  );

  return { authState, isAuthenticated, AuthGuard, checkAuth };
}
