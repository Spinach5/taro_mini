// utils/location.weapp.js
import Taro from "@tarojs/taro";

/**
 * 微信小程序端获取当前位置（使用 Taro.getLocation）
 * 需要先在 app.config.js 中配置 permission 和 requiredPrivateInfos
 * @param {Object} options 配置项（可选）
 * @param {string} options.type 坐标系，默认 'gcj02'（国测局坐标），可选 'wgs84'
 * @param {number} options.altitude 是否获取高度信息，默认 false
 * @returns {Promise<{latitude: number, longitude: number, speed?: number, accuracy?: number, altitude?: number, verticalAccuracy?: number, horizontalAccuracy?: number}>}
 */
export default async function getLocation(options = {}) {
  const { type = "gcj02", altitude = false } = options;

  // 1. 检查是否有定位权限（可选，但推荐）
  try {
    const setting = await Taro.getSetting();
    if (setting.authSetting['scope.userLocation'] === false) {
      // 用户已拒绝授权，引导去开启
      const res = await Taro.showModal({
        title: '需要位置权限',
        content: '请允许获取您的位置信息，以便提供准确的天气服务',
        confirmText: '去设置',
        cancelText: '取消'
      });
      if (res.confirm) {
        await Taro.openSetting();
        // 重新尝试获取位置
        return await Taro.getLocation({ type, altitude });
      } else {
        throw new Error('用户拒绝授权');
      }
    }
  } catch (err) {
    console.error('权限检查失败', err);
    throw err;
  }

  // 2. 直接调用定位（如果已有权限或未决定，会触发弹窗）
  try {
    const res = await Taro.getLocation({ type, altitude });
    return {
      latitude: res.latitude,
      longitude: res.longitude,
    //   speed: res.speed,
    //   accuracy: res.accuracy,
    //   altitude: res.altitude,
    //   verticalAccuracy: res.verticalAccuracy,
    //   horizontalAccuracy: res.horizontalAccuracy
    };
  } catch (err) {
    console.error('获取位置失败', err);
    let errorMsg = '定位失败';
    if (err.errMsg) {
      if (err.errMsg.includes('auth deny')) {
        errorMsg = '请授权位置权限';
      } else if (err.errMsg.includes('timeout')) {
        errorMsg = '定位超时，请检查网络或GPS信号';
      }
    }
    throw new Error(errorMsg);
  }
}
