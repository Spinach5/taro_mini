export function extractXhidFromHtml(html) {
	const match = html.match(
  		/<input[^>]*id=["']encodeId["'][^>]*value=["']([^"']*)["']/i
);
	return match ? match[1] : null;
}

export function parseCookiesToKeyValue(cookieStr) {
	// 1. 按逗号分割每一条独立 Cookie
	const cookieItems = cookieStr.split(",");
	const result = {};

	for (const item of cookieItems) {
		if (!item.trim()) continue;

		// 2. 每条按分号分割，第一项就是 key=value
		const parts = item.split(";");
		const keyValue = parts[0].trim();

		// 3. 拆分 key 和 value
		const equalIndex = keyValue.indexOf("=");
		if (equalIndex === -1) continue;

		const key = keyValue.slice(0, equalIndex).trim();
		const value = keyValue.slice(equalIndex + 1).trim();

		if (key && !result.hasOwnProperty(key)) {
			result[key] = value;
		}
	}

	return result;
}

export function stringifyCookieObj(cookieObj) {
	return Object.entries(cookieObj)
		.map(([k, v]) => `${k}=${v}`)
		.join("; ");
}
