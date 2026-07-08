// src/service/userInfo.js — 向后兼容层，内部委托给 useUserStore
import Taro from "@tarojs/taro";
import { cleanH5Cookies } from "../utils/platform/cleanH5Cookies";
import { hbutCookies, opendiffCookies, giteeCookies } from "../utils/platform/request";
import useUserStore from "../store/useUserStore";

/**
 * UserManager 向后兼容包装器
 * 所有状态读写委托给 zustand useUserStore
 * 保持原有 API 不变，现有代码无需修改
 */
class UserManager {
  constructor() {
    this.password = ""; // 明文密码仅存内存，不持久化
    this.cacheKey = "userInfo"; // 保留用于旧缓存迁移
  }

  // 从 zustand store 读取状态
  get _state() {
    return useUserStore.getState();
  }

  // 同步获取用户信息
  getUserInfoSync() {
    const state = this._state;
    return {
      university: state.university,
      realName: state.realName,
      stuId: state.stuId,
      grade: state.grade,
      majority: state.majority,
      college: state.college,
      class: state.class,
      schoolId: state.schoolId,
      isLoggedIn: state.isLoggedIn,
    };
  }

  // 获取/设置服务器 token
  getServerToken() {
    return this._state.serverToken;
  }
  setServerToken(token) {
    useUserStore.setState({ serverToken: token });
  }

  // 从 JWT 中解析服务器用户 ID
  getServerUserId() {
    return this._state.getServerUserId();
  }

  // 获取/设置加密后的密码
  getEncryptedPassword() {
    return this._state.encryptedPassword;
  }
  setEncryptedPassword(encryptedPwd) {
    useUserStore.setState({ encryptedPassword: encryptedPwd });
  }

  // 获取/设置学校代码
  getSchoolId() {
    return this._state.schoolId;
  }
  setSchoolId(id) {
    useUserStore.setState({ schoolId: id });
  }

  // 修改单个字段
  setField(key, value) {
    if (key === "password") {
      this.password = value; // 密码存为实例属性，不经过 zustand 持久化
    }
    useUserStore.setState({ [key]: value });
  }

  // 批量修改字段
  setFields(fields) {
    useUserStore.setState(fields);
  }

  // 从缓存加载用户信息（zustand persist 自动处理，这里仅做兼容）
  async loadFromCache() {
    // zustand persist 在 store 创建时自动加载
    // 这里检查是否有旧格式缓存需要迁移
    try {
      const TaroMod = require("@tarojs/taro").default;
      const oldCache = TaroMod.getStorageSync(this.cacheKey);
      if (oldCache && oldCache.isLoggedIn && !this._state.isLoggedIn) {
        // 迁移旧缓存到 zustand
        useUserStore.setState({
          university: oldCache.university || "",
          realName: oldCache.realName || "帅哥",
          stuId: oldCache.stuId || "",
          encryptedPassword: oldCache.encryptedPassword || "",
          grade: oldCache.grade || "0",
          majority: oldCache.majority || "",
          class: oldCache.class || "",
          college: oldCache.college || "",
          schoolId: oldCache.schoolId || "",
          serverToken: oldCache.serverToken || "",
          isLoggedIn: oldCache.isLoggedIn || false,
        });
        console.log("[UserManager] 旧缓存已迁移到 zustand store");
        return true;
      }
    } catch (e) {
      // ignore
    }
    return this._state.isLoggedIn;
  }

  // 注销
  logout() {
    // 清除内存中的密码
    this.password = "";

    // 清除 Cookie
    hbutCookies.clear();
    opendiffCookies.clear();
    giteeCookies.clear();

    // 通过 zustand 清除用户状态
    useUserStore.getState().logout();

    // 清除所有持久化存储
    Taro.clearStorage();
    // 关闭自动登录（用户主动退出视为关闭）
    // 必须在 clearStorage 之后，否则 zustand persist 会覆盖为旧值
    useUserStore.getState().setAutoLogin(false);
    useUserStore.getState().setSavedPassword('');
    if (process.env.TARO_ENV === "h5") {
      cleanH5Cookies();
    }
    console.log("用户已注销，所有信息已清空");
  }

  // 检查是否登录
  checkLogin() {
    return this._state.isLoggedIn;
  }

  // 获取当前大学
  getUniversity() {
    return this._state.university;
  }

  getGrade() {
    return this._state.grade;
  }

  // 获取学号和密码
  getAccount() {
    return { stuId: this._state.stuId, password: this.password };
  }

  // 属性访问器（兼容直接访问 userManager.stuId 等）
  get stuId() { return this._state.stuId; }
  get realName() { return this._state.realName; }
  get university() { return this._state.university; }
  get grade() { return this._state.grade; }
  get majority() { return this._state.majority; }
  get class() { return this._state.class; }
  get college() { return this._state.college; }
  get schoolId() { return this._state.schoolId; }
  get serverToken() { return this._state.serverToken; }
  get isLoggedIn() { return this._state.isLoggedIn; }
  get encryptedPassword() { return this._state.encryptedPassword; }
}

// 导出全局唯一实例
const userManager = new UserManager();

// 初始化：从缓存加载（zustand persist 自动处理）
userManager.loadFromCache();

export default userManager;
export const getUserInfo = () => userManager.getUserInfoSync();
export const setUserField = (key, value) => userManager.setField(key, value);
export const setUserFields = (fields) => userManager.setFields(fields);
export const isLoggedIn = () => userManager.checkLogin();
export const getGrade = () => userManager.getGrade();
export const getServerToken = () => userManager.getServerToken();
export const setServerToken = (token) => userManager.setServerToken(token);
export const getSchoolId = () => userManager.getSchoolId();
