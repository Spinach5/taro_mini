/**
 * 提取并清洗成绩数据
 * @param {Array} scores - 原始成绩数组
 * @returns {Array<{xnxq: string, kcmc: string, xf: string, sfbk: string, zhcj: number}>}
 */
export function extractScores(scores) {
  if (!Array.isArray(scores)) return [];
  return scores.map(item => {
    // 去除课程名称前的班号，如 "[20302106A]数字逻辑" => "数字逻辑"
    const cleanName = (item.kcmc || '').replace(/^\[\S+\]\s*/, '');
    // 处理最终成绩：如果是数字就转数字，否则置0
    let zhcj = Number(item.zhcj);
    if (Number.isNaN(zhcj)) zhcj = 0;
    return {
      xnxq: item.xnxq || '',
      kcmc: cleanName,
      xf: item.xf != null ? String(item.xf) : '',
      sfbk: item.sfbk != null ? String(item.sfbk) : '0',
      zhcj
    };
  });
}
