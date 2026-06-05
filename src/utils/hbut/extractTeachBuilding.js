/**
 * 从教务系统HTML中提取教学楼名称→代码映射
 * @param {string} html - 包含教学楼选择器的HTML字符串
 * @returns {{ [name: string]: string }} 教学楼映射对象，如 { "1教": "9", "2教": "16" }
 */
export function extractTeachBuilding(html) {
  const result = {};

  // 提取 <select id="jxldm"> 内部的所有 <option>
  const selectMatch = html.match(/<select[^>]*id="jxldm"[^>]*>([\s\S]*?)<\/select>/i);
  if (!selectMatch) return result;

  const optionRegex = /<option\s+value="([^"]*)"[^>]*>([^<]*)<\/option>/gi;
  let match;
  while ((match = optionRegex.exec(selectMatch[1])) !== null) {
    const value = match[1];
    const text = match[2].trim();
    // 跳过"请选择"占位项 且 去重（只保留首次出现）
    if (value !== "" && !(text in result)) {
      result[text] = value;
    }
  }

  return result;
}

export function extractTeachBuildingCategory(html) {
  const result = {};

  // 提取 <select id="jslx"> 内部的所有 <option>
  const selectMatch = html.match(/<select[^>]*id="jslx"[^>]*>([\s\S]*?)<\/select>/i);
  if (!selectMatch) return result;

  const optionRegex = /<option\s+value="([^"]*)"[^>]*>([^<]*)<\/option>/gi;
  let match;
  while ((match = optionRegex.exec(selectMatch[1])) !== null) {
    const value = match[1];
    const text = match[2].trim();
    // 跳过"请选择"占位项 且 去重（只保留首次出现）
    if (value !== "" && !(text in result)) {
      result[value] = text;
    }
  }

  return result;
}
