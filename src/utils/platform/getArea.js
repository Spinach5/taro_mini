// h5端根据经纬度逆地理编码（获取城市、区县等信息）
import Taro from "@tarojs/taro";
import { API_BASE } from '../../config/api';
import createRequest from "./request";        // 默认导入已配置好的请求实例
import runtimeLogger from '../common/runtimeLogger';


/**
 * 根据经纬度获取地理位置信息（逆地理编码）
 * 使用 api.bigdatacloud.net 的 reverse-geocode-client 接口
 * @param {number} latitude  纬度
 * @param {number} longitude 经度
 * @returns {Promise<{city: string, locality: string, principalSubdivision: string}>}
 */
export default async function getArea(latitude, longitude) {
  const loginConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: "https://ipapi.co",
      Origin: "https://ipapi.co",
    },
    withCredentials: true,
  };

  try {
    const response = await createRequest.get(
      `${API_BASE.bigdata}/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh-Hans`,
      loginConfig
    );

    // 检查 HTTP 状态码
    const status = response.status || response.status;
    if (status !== 200) {
      console.error("[getLocationFromCoords] 网络请求失败, status:", status);
      throw new Error(`网络请求失败: ${status}`);
    }

    const data = response.data;

    // 校验响应数据是否包含必要字段
    if (!data || typeof data !== "object") {
      throw new Error("返回数据格式异常");
    }
    // 提取地理位置信息，提供默认值避免 undefined
    const city = data.city || "-";
    const locality = data.locality || "-";
    const principalSubdivision = data.principalSubdivision || "-";

    // 可选：记录成功日志
    console.log(`[getLocationFromCoords] 解析成功: ${principalSubdivision} ${city} ${locality}`);

    return {
      city,                 // 城市（例如 "武汉市"）
      locality,            // 区县（例如 "洪山区"）
      principalSubdivision, // 省/自治区（例如 "湖北省"）
    };
  } catch (error) {
    console.error("[getLocationFromCoords] 异常:", error.message);
    runtimeLogger.error("getLocationFromCoords", error.message);
    // 重新抛出一个更友好的错误
    throw new Error(`获取地理位置失败: ${error.message}`);
  }
}
