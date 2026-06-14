/**
 * 提取实训信息
 * @param {Array} data - 包含实训信息的数组
 * @returns {Array<{jxbzc: string, kcmc: string, xkrs: string, zcstr: string}>}
 */
export function extractPracticeInfo(data) {
	if (!Array.isArray(data)) return [];
	return data.map((item) => ({
		jxbzc: item.jxbzc || "",
		kcmc: (item.kcmc || '').replace(/<[^>]*>/g, ''),
		xkrs: item.xkrs || "",
		zcstr: item.zcstr || "",
		zjname: (item.zjname || "").replace(/<[^>]*>/g, ""),
	}));
}
