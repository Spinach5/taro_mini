/**
 * 从学校主页 HTML 中提取轮播图地址列表
 * 轮播图位于 <div class="d-banner"> 内的 <div class="swiper-slide"> 中
 * @param {string} html - 学校主页 HTML 内容
 * @returns {string[]} 绝对路径的轮播图 URL 数组
 */
export function extractBannerImages(html) {
  // 防护：非字符串直接返回空数组
  console.log("[extractBannerImages] 输入:", html);
  if (!html || typeof html !== "string") {
    console.warn("[extractBannerImages] 输入不是有效的 HTML 字符串, 类型:", typeof html);
    return [];
  }

  const BASE = "https://www.hbut.edu.cn/";

  // 1. 截取轮播图区域（缩小正则搜索范围，避免匹配到页面其他 img）
  const bannerMatch = html.match(
    /<div class="d-banner">([\s\S]*?)<div class="swiper-btns">/
  );
  if (!bannerMatch) return [];

  // 2. 提取所有 img 标签的 src 属性
  const imgRegex = /<img\s+src="([^"]+)"/g;
  const images = [];
  let match;
  while ((match = imgRegex.exec(bannerMatch[1])) !== null) {
    images.push(BASE + match[1]);
  }

  return images;
}
