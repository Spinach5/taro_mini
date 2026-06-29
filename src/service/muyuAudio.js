import Taro from "@tarojs/taro";
import cacheManager from "../utils/common/cache";
import runtimeLogger from "../utils/common/runtimeLogger";
import audio_muyu from "../assets/audio/muyu.mp3";
import audio_moo from "../assets/audio/moo.mp3";

const CACHE_CUSTOM_AUDIOS = "MUYU_CUSTOM_AUDIOS";
const CACHE_CURRENT_AUDIO = "MUYU_CURRENT_AUDIO";
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB

export const BUILTIN_AUDIOS = {
	muyu: { label: "木鱼声", src: audio_muyu, builtIn: true },
	moo: { label: "牛叫声", src: audio_moo, builtIn: true },
};

export const IMPORT_ROW_KEY = "__import_local__";

function genCustomId() {
	return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getCustomAudios() {
	return cacheManager.get(CACHE_CUSTOM_AUDIOS) || [];
}

export function saveCustomAudios(list) {
	cacheManager.set(CACHE_CUSTOM_AUDIOS, list);
}

export function getSavedCurrentKey() {
	return cacheManager.get(CACHE_CURRENT_AUDIO);
}

export function saveCurrentKey(key) {
	cacheManager.set(CACHE_CURRENT_AUDIO, key);
}

/** 合并内置 + 自定义音频为选择列表 */
export function buildAudioCatalog() {
	const catalog = { ...BUILTIN_AUDIOS };
	getCustomAudios().forEach((item) => {
		catalog[item.id] = {
			label: item.name,
			src: item.src,
			builtIn: false,
			customId: item.id,
		};
	});
	return catalog;
}

export function getAudioLabel(key, catalog) {
	const entry = catalog?.[key];
	if (!entry) return "未知";
	return entry.label || key;
}

function pickAudioFileH5() {
	return new Promise((resolve, reject) => {
		if (typeof document === "undefined") {
			reject(new Error("当前环境不支持文件选择"));
			return;
		}
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "audio/*,.mp3,.wav,.m4a,.aac,.ogg";
		input.onchange = () => {
			const file = input.files?.[0];
			if (!file) {
				reject(new Error("未选择文件"));
				return;
			}
			if (file.size > MAX_FILE_SIZE) {
				reject(new Error("音频文件不能超过 3MB"));
				return;
			}
			const reader = new FileReader();
			reader.onload = () => {
				resolve({ name: file.name.replace(/\.[^.]+$/, "") || "本地音频", src: reader.result });
			};
			reader.onerror = () => reject(new Error("读取文件失败"));
			reader.readAsDataURL(file);
		};
		input.click();
	});
}

/** 打开文件选择器并导入音频到缓存 */
export async function importLocalAudio() {
	const isH5 = process.env.TARO_ENV === "h5";
	let picked;

	if (isH5) {
		picked = await pickAudioFileH5();
	} else {
		try {
			const res = await Taro.chooseMessageFile({
				count: 1,
				type: "file",
				extension: ["mp3", "wav", "m4a", "aac", "ogg"],
			});
			const file = res.tempFiles[0];
			if (file.size > MAX_FILE_SIZE) {
				throw new Error("音频文件不能超过 3MB");
			}
			const saveRes = await Taro.saveFile({ tempFilePath: file.path });
			picked = {
				name: (file.name || "本地音频").replace(/\.[^.]+$/, ""),
				src: saveRes.savedFilePath,
			};
		} catch (err) {
			if (err?.errMsg?.includes("cancel")) throw err;
			const mediaRes = await Taro.chooseMedia({
				count: 1,
				mediaType: ["audio"],
			});
			const file = mediaRes.tempFiles[0];
			const saveRes = await Taro.saveFile({ tempFilePath: file.tempFilePath });
			picked = {
				name: "本地音频",
				src: saveRes.savedFilePath,
			};
		}
	}

	const id = genCustomId();
	const list = getCustomAudios();
	list.push({ id, name: picked.name, src: picked.src, createdAt: Date.now() });
	saveCustomAudios(list);
	return id;
}

/** 删除自定义音频 */
export async function deleteCustomAudio(customId) {
	const list = getCustomAudios();
	const target = list.find((a) => a.id === customId);
	if (!target) return false;

	if (process.env.TARO_ENV !== "h5" && target.src && !target.src.startsWith("data:")) {
		try {
			await Taro.removeSavedFile({ filePath: target.src });
		} catch (e) {
			runtimeLogger.warn("MuYu", "删除本地音频文件失败", e);
		}
	}

	saveCustomAudios(list.filter((a) => a.id !== customId));
	return true;
}
