/**
 * 提取排课周数（排除第0周）
 * @param {Array} list - zclist 数组，每个对象包含 zc 字段
 * @returns {number[]} 去重并排序后的周数数组，不含0
 */
export function extractZc(list) {
  if (!Array.isArray(list)) {
    throw new TypeError('extractZc 要求参数为数组，例如 zclist');
  }

  const zcSet = new Set();
  for (const item of list) {
    const zcNum = Number(item.zc);
    // 排除无效数字和数字0
    if (!Number.isNaN(zcNum) && zcNum !== 0) {
      zcSet.add(zcNum);
    }
  }

  return Array.from(zcSet).sort((a, b) => a - b);
}
