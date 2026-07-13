import Taro from "@tarojs/taro";

export const RUNTIME_LOGS_CACHE_KEY = "RUNTIME_LOGS";
const CACHE_KEY = RUNTIME_LOGS_CACHE_KEY;

/** 日志读写直连 storage，避免与 cache 错误处理循环依赖 */
function readLogsRaw() {
	try {
		const raw = Taro.getStorageSync(CACHE_KEY);
		if (!raw) return [];
		const data = raw && raw.data ? raw.data : raw;
		return Array.isArray(data) ? data : [];
	} catch {
		return [];
	}
}

function writeLogsRaw(logs) {
	try {
		Taro.setStorageSync(CACHE_KEY, { data: logs, timestamp: Date.now() });
		return true;
	} catch {
		return false;
	}
}
const MAX_LOGS = 500;

const LEVELS = {
	DEBUG: "DEBUG",
	INFO: "INFO",
	WARN: "WARN",
	ERROR: "ERROR",
};

function pad2(n) {
	return String(n).padStart(2, "0");
}

function formatTime(ts) {
	const d = new Date(ts);
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function serializeExtra(extra) {
	if (extra == null) return "";
	if (extra instanceof Error) {
		return extra.stack || extra.message || String(extra);
	}
	if (typeof extra === "object") {
		try {
			return JSON.stringify(extra);
		} catch {
			return String(extra);
		}
	}
	return String(extra);
}

class RuntimeLogger {
	_append(level, tag, message, extra) {
		const entry = {
			id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			time: Date.now(),
			level,
			tag: tag || "App",
			message: message || "",
			extra: serializeExtra(extra),
		};

		const logs = this.getLogs();
		logs.push(entry);
		if (logs.length > MAX_LOGS) {
			logs.splice(0, logs.length - MAX_LOGS);
		}
		writeLogsRaw(logs);

		const line = this.formatEntry(entry);
		const extraStr = (extra !== null && extra !== undefined) ? extra : "";
		switch (level) {
			case LEVELS.ERROR:
				console.error(line, extraStr);
				break;
			case LEVELS.WARN:
				console.warn(line, extraStr);
				break;
			case LEVELS.DEBUG:
				console.debug(line, extraStr);
				break;
			default:
				console.log(line, extraStr);
		}
		return entry;
	}

	formatEntry(entry) {
		const extraPart = entry.extra ? ` | ${entry.extra}` : "";
		return `[${formatTime(entry.time)}] [${entry.level}] [${entry.tag}] ${entry.message}${extraPart}`;
	}

	debug(tag, message, extra) {
		return this._append(LEVELS.DEBUG, tag, message, extra);
	}

	info(tag, message, extra) {
		return this._append(LEVELS.INFO, tag, message, extra);
	}

	warn(tag, message, extra) {
		return this._append(LEVELS.WARN, tag, message, extra);
	}

	error(tag, message, extra) {
		return this._append(LEVELS.ERROR, tag, message, extra);
	}

	getLogs() {
		return readLogsRaw();
	}

	getTextForCopy() {
		const logs = this.getLogs();
		if (logs.length === 0) return "";
		return logs.map((e) => this.formatEntry(e)).join("\n");
	}

	clear() {
		try {
			Taro.removeStorageSync(CACHE_KEY);
		} catch {
			/* ignore */
		}
	}
}

const runtimeLogger = new RuntimeLogger();
export default runtimeLogger;
