import { View, Text, ScrollView } from "@tarojs/components";
import "./index.css";

export default function DetailModal({ visible, title, children, onClose, className = '' }) {
  if (!visible) return null;

  return (
    <View className={`modal-overlay ${className}`} onClick={onClose}>
      <View className="modal-content bora" onClick={(e) => e.stopPropagation()}>
        <View className="modal-header">
          <Text className="modal-title">{title}</Text>
        </View>
        <ScrollView scrollY className="modal-body">
          {children}
        </ScrollView>
        <View className="modal-footer">
          <View className="confirm-btn bora" onClick={onClose}>
            <Text className="confirm-text">关闭</Text>
          </View>
        </View>
      </View>
    </View>
  );
}