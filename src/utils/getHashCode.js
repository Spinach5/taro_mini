export function getHashCode(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

export function getColorFromName(courseName) {
	const hue = getHashCode(courseName) % 360;
	return `hsl(${hue}, 70%, 55%)`;
}

export function getBgFromColor(color) {
	// 匹配 hsl(数字, 数字%, 数字%)
	const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
	if (!match) return "rgba(200,200,200,0.2)"; // 降级

	const hue = parseInt(match[1]);
	// 原饱和度一般为70%，变淡后降到 30% 左右
	const sat = 90;
	// 原亮度一般为55%，变淡后提高到 85% 左右
	const light = 85;

	// 如果需要半透明背景，可以在后面加上 alpha，例如：
	// return `hsla(${hue}, ${sat}%, ${light}%, 0.8)`;
	// 如果不需透明，直接返回 hsl
	return `hsl(${hue}, ${sat}%, ${light}%)`;
}
