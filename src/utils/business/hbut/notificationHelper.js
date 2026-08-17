/**
 * 通知功能 HTML 解析与清洗纯函数
 * 仅依赖正则，不引入 DOM 解析库，便于单测。
 */

/** 清洗 option 文本：去标签、解码常见 HTML 实体、折叠空白 */
export function cleanOptionText(raw) {
  return String(raw === null || raw === undefined ? "" : raw)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 从 HTML 中提取指定 id 的 <select> 下的 <option>，组装为 { value: text } 字典。
 * - 兼容双引号/单引号属性、selected 等附加属性，属性顺序无关
 * - 空 value 保留（对应「全部」）；清洗后文本为空的非空 value 视为脏数据丢弃
 * - 解析不到 <select> 或 0 个 <option> 时返回 null（视为抓取失败）
 * @param {string} html - 教务页 HTML
 * @param {string} selectId - select 的 id（如 "type" / "noticeType"）
 * @returns {Object|null}
 */
export function parseSelectOptions(html, selectId) {
  if (!html || typeof html !== "string") return null;

  const selectRe = new RegExp(
    `<select[^>]*\\bid=["']${selectId}["'][^>]*>([\\s\\S]*?)<\\/select>`,
    "i"
  );
  const block = html.match(selectRe)?.[1];
  if (!block) return null;

  const optionRe = /<option[^>]*\bvalue=["']([^"']*)["'][^>]*>([\s\S]*?)<\/option>/gi;
  const dict = {};
  let match = null;
  let count = 0;

  while ((match = optionRe.exec(block)) !== null) {
    const value = match[1];
    const text = cleanOptionText(match[2]);
    if (text === "" && value !== "") continue; // 过滤脏数据（E-12）
    dict[value] = text;
    count++;
  }

  return count === 0 ? null : dict;
}
