// 获取学校主页轮播图
import { API_BASE } from "../../../config/api";
import createRequest from "../../../utils/platform/request";
import withCache from "../../../utils/common/withCache";
import { extractBannerImages } from "../../../utils/business/hbut/bannerHelper";
import runtimeLogger from "../../../utils/common/runtimeLogger";

/**
 * 获取学校主页轮播图地址列表
 * @param {boolean} forceRefresh 是否强制刷新（忽略缓存）
 * @returns {Promise<string[]>} 轮播图绝对 URL 数组
 */
export const getBanner = (() => {
  const cached = withCache("v1_banner", 10 * 60 * 1000, async () => {
    const loginConfig = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: "https://www.hbut.edu.cn",
        Origin: "https://www.hbut.edu.cn",
      },
      withCredentials: true,
      responseType: "text",
      dataType: "string",
    };
    try {
      // 通过封装好的 request 请求学校主页 HTML（H5 走 Vite 代理，weapp 直连）
      const response = await createRequest.get(
        `${API_BASE.hbut_www}/`,
        loginConfig,
      );

      if (response.status !== 200) {
        console.warn(`[getBanner] 请求失败, status: ${response.status}`);
        return [];
      }

      // 提取轮播图地址
      const html = response.data;
      const images = extractBannerImages(html);
      console.log(`[getBanner] 提取到 ${images.length} 张轮播图`);

      return images;
    } catch (error) {
      runtimeLogger.error("Banner", "获取轮播图失败", error);
      throw error;
    }
  });

  return async function getBanner(forceRefresh = false) {
    if (forceRefresh) {
      cached.invalidate();
      console.log("[getBanner] 已清除轮播图缓存");
    }
    return cached();
  };
})();
