import { View, Text } from "@tarojs/components";
import { useRef } from "react";
import "./index.css";

export default function DetailModal({ visible, title, children, onClose, className = '' }) {
  const touchInContent = useRef(false);

  if (!visible) return null;

  const handleOverlayTouchMove = (e) => {
    if (!touchInContent.current) {
      e.preventDefault();
    }
  };

  const handleContentTouchStart = () => {
    touchInContent.current = true;
  };

  const handleContentTouchEnd = () => {
    touchInContent.current = false;
  };

  return (
    <View
      className={`modal-overlay ${className}`}
      onTouchMove={handleOverlayTouchMove}
    >
      <View
        className="modal-content bora"
        onTouchStart={handleContentTouchStart}
        onTouchEnd={handleContentTouchEnd}
      >
        <View className="modal-header">
          <Text className="modal-title">{title}</Text>
        </View>
        <View className="modal-body">
          {children}
        </View>
        <View className="modal-footer">
          <View
            className="confirm-btn bora"
            onClick={onClose}
            onTouchEnd={(e) => { e.preventDefault(); onClose?.(); }}
          >
            <Text className="confirm-text">关闭</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
