import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import SelectAudioModal from "./SelectAudioModal";
import { Muyu, MuyuStick } from "../assets/MuyuIcon";
import "./MuYu.css";
import { AtIcon } from "taro-ui";
import {
	buildAudioCatalog,
	getSavedCurrentKey,
	saveCurrentKey,
	getAudioLabel,
	importLocalAudio,
	deleteCustomAudio,
	IMPORT_ROW_KEY,
} from "../service/muyuAudio";
import runtimeLogger from "../utils/runtimeLogger";

const FLOAT_TEXTS = ["功德 +1", "+1", "咚~", "善哉"];

export default function MuYu({ merit = 0, onMerit }) {
	const [showAudioModal, setShowAudioModal] = useState(false);
	const [audioCatalog, setAudioCatalog] = useState(() => buildAudioCatalog());
	const [currentAudioKey, setCurrentAudioKey] = useState("muyu");
	const [isHitting, setIsHitting] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [floatTexts, setFloatTexts] = useState([]);

	const audioCtxRef = useRef(null);
	const hitTimerRef = useRef(null);
	const floatIdRef = useRef(0);

	const currentLabel = useMemo(
		() => getAudioLabel(currentAudioKey, audioCatalog),
		[currentAudioKey, audioCatalog],
	);

	const modalItems = useMemo(() => {
		const list = Object.entries(audioCatalog).map(([key, entry]) => ({
			key,
			label: entry.label,
			isCustom: !entry.builtIn,
		}));
		list.push({ key: IMPORT_ROW_KEY, label: "本地导入", isCustom: false });
		return list;
	}, [audioCatalog]);

	const refreshCatalog = useCallback(() => {
		const catalog = buildAudioCatalog();
		setAudioCatalog(catalog);
		return catalog;
	}, []);

	useEffect(() => {
		const saved = getSavedCurrentKey();
		const catalog = buildAudioCatalog();
		if (saved && catalog[saved]) {
			setCurrentAudioKey(saved);
		}
		setAudioCatalog(catalog);

		return () => {
			if (audioCtxRef.current) {
				audioCtxRef.current.destroy();
				audioCtxRef.current = null;
			}
			if (hitTimerRef.current) clearTimeout(hitTimerRef.current);
		};
	}, []);

	const playAudio = useCallback(
		(key) => {
			const entry = audioCatalog[key];
			if (!entry?.src) return;

			if (!audioCtxRef.current) {
				const ctx = Taro.createInnerAudioContext();
				ctx.onPlay(() => setIsPlaying(true));
				ctx.onEnded(() => setIsPlaying(false));
				ctx.onStop(() => setIsPlaying(false));
				ctx.onError((res) => {
					runtimeLogger.error("MuYu", "音频播放失败", res);
					setIsPlaying(false);
					Taro.showToast({ title: "播放失败", icon: "none" });
				});
				audioCtxRef.current = ctx;
			}

			const ctx = audioCtxRef.current;
			ctx.stop();
			ctx.src = entry.src;
			ctx.play();
		},
		[audioCatalog],
	);

	const addFloatText = useCallback(() => {
		const id = ++floatIdRef.current;
		const text = FLOAT_TEXTS[Math.floor(Math.random() * FLOAT_TEXTS.length)];
		const left = 30 + Math.random() * 40;
		const top = 35 + Math.random() * 20;
		setFloatTexts((prev) => [...prev, { id, text, left, top }]);
		setTimeout(() => {
			setFloatTexts((prev) => prev.filter((f) => f.id !== id));
		}, 900);
	}, []);

	const triggerHitEffect = useCallback(() => {
		if (hitTimerRef.current) clearTimeout(hitTimerRef.current);
		setIsHitting(true);
		hitTimerRef.current = setTimeout(() => setIsHitting(false), 400);
	}, []);

	const handleClick = () => {
		triggerHitEffect();
		addFloatText();
		onMerit?.();
		playAudio(currentAudioKey);
	};

	const handleSelectAudio = (key) => {
		setCurrentAudioKey(key);
		saveCurrentKey(key);
		setShowAudioModal(false);
	};

	const handleImportLocal = async () => {
		try {
			const newId = await importLocalAudio();
			const catalog = refreshCatalog();
			setCurrentAudioKey(newId);
			saveCurrentKey(newId);
			Taro.showToast({ title: "导入成功", icon: "success" });
			playAudio(newId);
		} catch (err) {
			const msg = err?.message || err?.errMsg || "";
			if (msg.includes("cancel") || msg.includes("取消")) return;
			Taro.showToast({
				title: err?.message || "导入失败",
				icon: "none",
			});
		}
	};

	const handleLongPressDelete = (key) => {
		const entry = audioCatalog[key];
		if (!entry?.customId) return;

		Taro.showModal({
			title: "删除音频",
			content: `确定删除「${entry.label}」吗？`,
			confirmText: "删除",
			confirmColor: "#e64340",
			success: async (res) => {
				if (!res.confirm) return;
				await deleteCustomAudio(entry.customId);
				const catalog = refreshCatalog();
				if (currentAudioKey === key) {
					const fallback = "muyu";
					setCurrentAudioKey(fallback);
					saveCurrentKey(fallback);
				}
				Taro.showToast({ title: "已删除", icon: "success" });
			},
		});
	};

	return (
		<View className="muyu-page-body">
			<View className="muyu-merit-card">
				<Text className="muyu-merit-label">今日功德</Text>
				<Text className="muyu-merit-value">{merit}</Text>
			</View>

			<View className="muyu-now-playing">
				<View className={`muyu-now-playing-icon ${isPlaying ? "playing" : ""}`} />
				<Text className="muyu-now-playing-text">当前音频：{currentLabel}</Text>
				<Text className="muyu-now-playing-status">
					{isPlaying ? "播放中" : "待敲击"}
				</Text>
			</View>

			<View className="muyu-stage">
				<View className={`muyu-container ${isHitting ? "hitting" : ""}`} onClick={handleClick}>
					<View className="muyu-glow" />
					<View className="muyu-ripple" />
					<MuyuStick className="muyu-stick" color="#5c4a32" />
					<Muyu className="muyu-img" color="#8B6914" />
					<View className="muyu-float-layer">
						{floatTexts.map((f) => (
							<Text
								key={f.id}
								className="muyu-float-text"
								style={{ left: `${f.left}%`, top: `${f.top}%` }}
							>
								{f.text}
							</Text>
						))}
					</View>
				</View>
			</View>

			<View className="choose-audio" onClick={() => setShowAudioModal(true)}>
				<AtIcon value="sound" color="#0069cc" size="20" />
				<Text className="choose-audio-text">选择音频</Text>
			</View>

			{showAudioModal && (
				<SelectAudioModal
					items={modalItems}
					currentAudioKey={currentAudioKey}
					onSelect={handleSelectAudio}
					onClose={() => setShowAudioModal(false)}
					onImportLocal={handleImportLocal}
					onLongPressItem={handleLongPressDelete}
				/>
			)}
		</View>
	);
}
