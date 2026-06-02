/**
 * 提取考试信息
 * @param {Object} raw - 原始 JSON 对象
 * @returns {{ total: number, exams: Array<{ kcmc: string, jsmc: string, kssj: string, ksfs: string, kspcmc: string, zwh: string|number }> }}
 */
export function extractExamInfo(raw) {
  const { total, results } = raw;
  return {
    total: parseInt(total, 10) || 0,
    exams: (results || []).map(item => ({
      kcmc: item.kcmc || '',
      jsmc: item.jsmc || '',
      kssj: item.kssj || '',
      ksfs: item.ksfs || '',
      kspcmc: item.kspcmc || '',
      zwh: item.zwh || ''
    }))
  };
}
