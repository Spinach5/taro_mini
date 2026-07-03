// h5端：优先使用浏览器原生 Geolocation API，回退到 IP 定位
import Taro from "@tarojs/taro";
import { API_BASE } from '../../config/api';
import createRequest from "./request";
import runtimeLogger from '../common/runtimeLogger';

/**
 * 通过浏览器原生 Geolocation API 获取当前位置
 * H5 环境优先方案：精准（GPS/WiFi）、无跨域问题、无限流
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
async function getLocationFromBrowser() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error("浏览器不支持 Geolocation API");
  }

  const position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: false,   // 低精度更快，天气不需要高精度
        timeout: 10000,              // 10 秒超时
        maximumAge: 300000,         // 5 分钟缓存
      },
    );
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

/**
 * 通过 IP 定位获取当前大致经纬度（使用 ipapi.co，经 Vite proxy 转发）
 * 浏览器定位失败时的回退方案
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
async function getLocationFromIP() {
  const loginConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: "https://ipapi.co",
      Origin: "https://ipapi.co",
    },
    withCredentials: true,
  };

  const response = await createRequest.get(
    API_BASE.ipapi + "/json/",
    loginConfig,
  );

  // 检查 HTTP 状态码
  if (response.status !== 200) {
    console.error(
      "[getLocation] IP 定位请求失败, statusCode:",
      response.status,
    );
    throw new Error(`网络请求失败: ${response.status}`);
  }

  const data = response.data;

  // 检查业务错误（例如限流）
  if (data.error) {
    console.warn(
      "[getLocation] IP API 返回错误:",
      data.reason || data.message,
    );
    const title =
      data.reason === "RateLimited"
        ? "获取位置过于频繁，请稍后再试"
        : data.message || "获取位置失败";
    Taro.showToast({
      title,
      icon: "none",
      duration: 2000,
    });
    throw new Error(data.reason || data.message);
  }

  // 校验返回的经纬度是否有效
  if (
    typeof data.latitude === "number" &&
    typeof data.longitude === "number"
  ) {
    return {
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } else {
    throw new Error("返回数据缺少经纬度信息");
  }
}

/**
 * 获取当前经纬度
 * 策略：浏览器原生 Geolocation API（精准） → IP 定位（回退）
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export default async function getLocation() {
  // 1. 优先使用浏览器原生定位
  try {
    const coords = await getLocationFromBrowser();
    console.log("[getLocation] 浏览器定位成功:", coords.latitude, coords.longitude);
    return coords;
  } catch (geoError) {
    // PERMISSION_DENIED / POSITION_UNAVAILABLE / TIMEOUT
    console.warn("[getLocation] 浏览器定位失败，回退到 IP 定位:", geoError.message);
  }

  // 2. 回退到 IP 定位
  try {
    const coords = await getLocationFromIP();
    console.log("[getLocation] IP 定位成功:", coords.latitude, coords.longitude);
    return coords;
  } catch (error) {
    console.error("[getLocation] IP 定位也失败:", error.message);
    runtimeLogger.error("getLocation", error.message);
    throw error;
  }
}
