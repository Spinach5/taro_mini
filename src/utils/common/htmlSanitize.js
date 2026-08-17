/**
 * 富文本 HTML 安全消毒工具
 * 用于 RichText / innerHTML 渲染前的 XSS 防护。
 * 纯函数、仅依赖正则，白名单策略：
 *   1. 整体剥离危险标签（含内容）
 *   2. 移除所有 on* 事件属性
 *   3. 移除 javascript:/vbscript:/data: 危险协议
 *   4. 清理 style 内的 expression / url(javascript:)
 *   5. 白名单之外的标签去掉标签壳、保留文本
 */

/** 允许保留的标签白名单 */
const ALLOWED_TAGS = new Set([
  "p", "br", "span", "div", "b", "strong", "i", "em", "u", "s", "strike",
  "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption",
  "img", "a", "font", "blockquote", "pre", "code", "hr",
  "sup", "sub", "small", "big", "center",
]);

const DANGEROUS_TAGS =
  "script|iframe|object|embed|style|svg|math|form|input|button|textarea|select|option|link|meta|base|applet|frameset|frame";

const DANGEROUS_TAG_SRC = `\\s*(${DANGEROUS_TAGS})\\b`;

/**
 * 消毒 HTML 字符串
 * @param {string} html - 原始 HTML
 * @returns {string} 消毒后的 HTML
 */
export function sanitizeHtml(html) {
  if (html === null || html === undefined) return "";
  let out = String(html);

  // 1. 危险标签整块删除（含内容），兼容标签名大小写与多余空白
  out = out.replace(
    new RegExp(`<${DANGEROUS_TAG_SRC}[^>]*>[\\s\\S]*?<\\s*\\/\\s*\\1\\s*>`, "gi"),
    ""
  );
  // 自闭合/未闭合的危险标签
  out = out.replace(
    new RegExp(`<${DANGEROUS_TAG_SRC}[^>]*/?\\s*>`, "gi"),
    ""
  );

  // 2. 移除所有 on* 事件属性
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 3. 移除 href/src 中的危险协议
  out = out.replace(/\s(href|src)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (m, attr, value) => {
    const inner = value.replace(/^["']|["']$/g, "");
    if (/^\s*(javascript|vbscript|data)\s*:/i.test(inner)) return "";
    return m;
  });

  // 4. style 属性清洗：去除 expression / url(javascript:) 等
  out = out.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (m, value) => {
    const cleaned = value
      .replace(/expression\s*\([^)]*\)/gi, "")
      .replace(/url\s*\(\s*["']?\s*(?:javascript|vbscript|data)\s*:[^)]*\)/gi, "")
      .replace(/[; ]?[a-z-]+\s*:\s*(?:javascript|vbscript)\s*:[^;"']*/gi, "");
    return ` style="${cleaned.replace(/["']/g, "")}"`;
  });

  // 5. 白名单之外的标签去掉标签壳（保留文本内容）
  out = out.replace(/<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>/g, (m) => {
    const tag = m.match(/^<\/?\s*([a-zA-Z][a-zA-Z0-9]*)/)?.[1];
    return tag && ALLOWED_TAGS.has(tag) ? m : "";
  });

  // 6. 移除 HTML 注释
  out = out.replace(/<!--[\s\S]*?-->/g, "");

  return out;
}
