/**
 * 将考试批次名称与 id 转为字典
 * @param {Array<{id: string|number, kspcmc: string}>} list
 * @returns {Object<string, string|number>} { kspcmc: id }
 */
export function extractExamBatch(list) {
  if (!Array.isArray(list)) return {};
  const map = {};
  list.forEach(item => {
    if (item.kspcmc && item.id !== undefined && item.id !== null) {
      map[item.kspcmc] = item.id;
    }
  });
  return map;
}
