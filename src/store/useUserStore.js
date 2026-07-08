import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import taroStorage from './storage';

/** 手写 Base64 解码，兼容微信小程序（没有 atob） */
function base64Decode(str) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  str = str.replace(/[^A-Za-z0-9+/=]/g, '');
  while (i < str.length) {
    const a = chars.indexOf(str.charAt(i++));
    const b = chars.indexOf(str.charAt(i++));
    const c = chars.indexOf(str.charAt(i++));
    const d = chars.indexOf(str.charAt(i++));
    output += String.fromCharCode((a << 2) | (b >> 4));
    if (c !== 64) output += String.fromCharCode(((b & 15) << 4) | (c >> 2));
    if (d !== 64) output += String.fromCharCode(((c & 3) << 6) | d);
  }
  return output;
}

const useUserStore = create(
  persist(
    (set, get) => ({
      // 用户基本信息
      university: '',
      realName: '帅哥',
      stuId: '',
      grade: '0',
      majority: '',
      class: '',
      college: '',
      schoolId: '',

      // 登录状态
      isLoggedIn: false,

      // 服务器相关
      serverToken: '',
      encryptedPassword: '',

      // 自动登录
      autoLoginEnabled: false,
      savedPassword: '',

      // Actions
      login: (userData) =>
        set({
          ...userData,
          isLoggedIn: true,
        }),

      logout: () =>
        set({
          university: '',
          realName: '帅哥',
          stuId: '',
          grade: '0',
          majority: '',
          class: '',
          college: '',
          schoolId: '',
          isLoggedIn: false,
          serverToken: '',
          encryptedPassword: '',
        }),

      setServerToken: (token) => set({ serverToken: token }),

      setUserFields: (fields) => set(fields),

      getServerUserId: () => {
        const token = get().serverToken;
        if (!token) return 0;
        try {
          const payload = token.split('.')[1];
          const decoded = JSON.parse(base64Decode(payload));
          return decoded.userId || decoded.user_id || decoded.id || 0;
        } catch {
          return 0;
        }
      },

      getEncryptedPassword: () => get().encryptedPassword,

      setEncryptedPassword: (pwd) => set({ encryptedPassword: pwd }),

      setSchoolId: (id) => set({ schoolId: id }),

      setAutoLogin: (enabled) => set({ autoLoginEnabled: enabled }),

      setSavedPassword: (pwd) => set({ savedPassword: pwd }),
    }),
    {
      name: 'user-store',
      storage: taroStorage,
      partialize: (state) => ({
        university: state.university,
        realName: state.realName,
        stuId: state.stuId,
        grade: state.grade,
        majority: state.majority,
        class: state.class,
        college: state.college,
        schoolId: state.schoolId,
        isLoggedIn: state.isLoggedIn,
        serverToken: state.serverToken,
        encryptedPassword: state.encryptedPassword,
        autoLoginEnabled: state.autoLoginEnabled,
        savedPassword: state.savedPassword,
      }),
    },
  ),
);

export default useUserStore;
