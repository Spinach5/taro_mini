// utils/requestWithRetry.js
import { auth } from "./auth";
import runtimeLogger from "../../utils/runtimeLogger";

/**
 * 判断响应是否表示登录已失效
 * @param {*} response - axios 返回的响应对象
 * @returns {boolean}
 */
function isCaptchaOrBan(response) {
  const html = typeof response?.data === "string" ? response.data : "";
  // 超星滑块验证 / 教务封禁页面 → 不应重试，需用户手动登录
  return /captcha|jcaptcha|ban_error|无法访问|chaoxing\.com\/load\.min\.js/i.test(html);
}

function isLoginInvalid(response) {
  // 1. 业务 JSON 返回错误码（常见 ret !== 0 或 code 非 200）
  if (response?.data) {
    const { ret, code } = response.data;
    if ((ret !== undefined && ret !== 0) || (code !== undefined && code !== 200)) {
      return true;
    }
  }

  // 2. 返回的是 HTML 登录页面（如重定向到 /login）
  if (typeof response?.data === "string") {
    if (/login|password|用户名|密码/i.test(response.data)) {
      return true;
    }
    if (/^<!DOCTYPE/i.test(response.data.trim())) {
      return true;
    }
  }

  // 3. 原始响应状态码
  const status = response?.status || response?.statusCode;
  if (status && [300, 302, 303].includes(Number(status))) {
    return true;
  }

  return false;
}

/**
 * 自动重登请求包装器
 * @param {Function} requestFn - 返回 Promise<response> 的请求函数
 * @param {Object} options
 * @param {number} options.maxRetry - 最大重试次数，默认1
 * @returns {Promise<any>}
 */
export async function AutoRetry(requestFn, options = {}) {
  const { maxRetry = 1 } = options;
  let retryCount = 0;

  const execute = async () => {
    try {
      const response = await requestFn();

      // 检测到验证码/封禁页面，直接报错，不重试
      if (isCaptchaOrBan(response)) {
        throw new Error("教务系统需要手动验证，请用浏览器打开 https://jwxt.hbut.edu.cn 登录一次后再试");
      }

      // 检查是否需要重登
      if (isLoginInvalid(response) && retryCount < maxRetry) {
        console.warn("[AutoRetry] 检测到登录失效，尝试重新登录...");
        runtimeLogger.warn("AutoRetry", "检测到登录失效，尝试重新登录");
        await auth();
        retryCount++;
        return await execute();
      }

      return response;
    } catch (error) {
      // 某些情况下请求直接抛出异常（如网络错误、超时）
      console.error("[AutoRetry] 请求异常：", error);
      runtimeLogger.error("AutoRetry", "请求异常", error);

      // 未登录异常才触发重登，重定向过多不重登（重新登录解决不了重定向链问题）
      const msg = error?.message || error?.errMsg || "";
      if (/unauthorized/i.test(msg) && retryCount < maxRetry) {
        console.warn("[AutoRetry] 捕获到未登录异常，尝试重新登录...");
        runtimeLogger.warn("AutoRetry", "捕获到未登录异常，尝试重新登录");
        await auth();
        retryCount++;
        return await execute();
      }

      throw error;
    }
  };

  return execute();
}
