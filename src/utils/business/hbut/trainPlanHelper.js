/**
 * 提取培养计划数据
 * @param {Array} data - 原始培养计划数据数组
 * @returns {Array<{kcmc: string, xf: string, zongxs: string, kkyxmc: string, sfbx: string, kcxz: string, sfsjhj: string, kcbh: string, sjzs: string}>}
 */
function stripHtml(str) {
  return (str || '').replace(/<[^>]*>/g, '');
}

export function extractTrainPlan(data) {
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    kcmc: stripHtml(item.kcmc),
    xf: item.xf != null ? String(item.xf) : '',
    zongxs: item.zongxs != null ? String(item.zongxs) : '',
    kkyxmc: stripHtml(item.kkyxmc || ''),
    sfbx: item.sfbx || '',
    kcxz: item.kcxz != null ? String(item.kcxz) : '',
    sfsjhj: item.sfsjhj != null ? String(item.sfsjhj) : '',
    kcbh: item.kcbh || '',
    sjzs: item.sjzs != null ? String(item.sjzs) : '',
  }));
}