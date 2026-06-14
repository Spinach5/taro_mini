/**
 * 提取考试信息
 * @param {Object} raw - 原始 JSON 对象
 * @returns {{ total: number, exams: Array<{ kcmc: string, jsmc: string, kssj: string, ksfs: string, kspcmc: string, zwh: string|number }> }}
 */
export function extractExamInfo(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      total: 0,
      exams: []
    };
  }

  const { total, results } = raw;
  const parsedTotal = Number.parseInt(total, 10);
  const safeTotal = Number.isNaN(parsedTotal) ? 0 : parsedTotal;

  const exams = (Array.isArray(results) ? results : [])
    .map(item => ({
      kcmc: (item.kcmc || '').replace(/<[^>]*>/g, ''),
      jsmc: (item.jsmc || '').replace(/<[^>]*>/g, ''),
      kssj: item.kssj || '',
      ksfs: item.ksfs || '',
      kspcmc: item.kspcmc || '',
      zwh: item.zwh || ''
    }))
    .sort((a, b) => {
      const timeA = a.kssj ? a.kssj.split('~')[0].trim() : '';
      const timeB = b.kssj ? b.kssj.split('~')[0].trim() : '';

      if (!timeA && !timeB) return 0;
      if (!timeA) return 1;
      if (!timeB) return -1;

      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });

  return {
    total: safeTotal,
    exams
  };
}
