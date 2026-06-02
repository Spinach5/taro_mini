import { View, Text, ScrollView } from "@tarojs/components";
import { IMPORT_ROW_KEY } from "../service/muyuAudio";
import "./SelectAudioModal.css";

export default function SelectAudioModal({
	items = [],
	currentAudioKey,
	onSelect,
	onClose,
	onImportLocal,
	onLongPressItem,
}) {
	return (
		<View className="audio-modal-mask" onClick={onClose}>
			<View
				className="audio-modal-container"
				onClick={(e) => e.stopPropagation()}
			>
				<View className="audio-modal-title">选择音频</View>
				<ScrollView scrollY className="audio-modal-list">
					{items.map((item) => {
						if (item.key === IMPORT_ROW_KEY) {
							return (
								<View
									key={item.key}
									className="audio-item audio-item-import"
									onClick={onImportLocal}
								>
									<Text className="audio-item-icon">+</Text>
									<Text>本地导入</Text>
								</View>
							);
						}

						const isActive = currentAudioKey === item.key;
						return (
							<View
								key={item.key}
								className={`audio-item ${isActive ? "audio-item-active" : ""} ${item.isCustom ? "audio-item-custom" : ""}`}
								onClick={() => onSelect(item.key)}
								onLongPress={() => item.isCustom && onLongPressItem?.(item.key)}
							>
								<Text className="audio-item-label">{item.label}</Text>
								{item.isCustom && (
									<Text className="audio-item-hint">长按可删除</Text>
								)}
							</View>
						);
					})}
				</ScrollView>
			</View>
		</View>
	);
}
