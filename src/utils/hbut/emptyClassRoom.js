/**
 * 提取空教室信息
 * @param {Array} data - 包含空教室的数组
 * @returns {Array<{jsmc: string, jslx: string, jxlmc: string, maxvolume: string}>}
 */
export function extractEmpytClassRoom(data) {
	if (!Array.isArray(data)) return [];
	return data.map((item) => ({
		jsmc: item.jsmc || "",
		jslx: item.jslx || "",
		jxlmc: item.jxlmc || "",
		maxvolume: item.zdskrnrs || ""
	}));
}
