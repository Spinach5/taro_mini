/**
 * 提取排课周次及其日期范围（排除第0周）
 * @param {Object} rawData - 原始接口返回的 JSON 对象
 * @returns {Array<{zc: number, rqfw: string}>} 周次与日期范围的数组
 */
export function extractZc(rawData) {
  const zclist = rawData?.data?.zclist;
  if (!Array.isArray(zclist)) return [];

  return zclist
    .filter(item => Number(item.zc) !== 0)
    .map(item => ({
      zc: Number(item.zc),
      rqfw: item.rqfw
    }));
}
