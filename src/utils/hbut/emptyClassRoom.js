/**
 * 提取实训信息
 * @param {Array} data - 包含空教室的数组
 * @returns {Array<{jsmc: string, jslx: string, jslmc: string, maxvolume: string}>}
 */
//教室名称jsmc 教室类型jslx 教学楼名称jxlmc 座位数maxvolume
export function extractEmpytClassRoom(data) {
	if (!Array.isArray(data)) return [];
	return data.map((item) => ({
		jsmc: item.jsmc || "",
		jslx: item.jxlx || "",
		jxlmc: item.jslmc || "",
		maxvolume: item.zdskrnrs || ""
	}));
}

