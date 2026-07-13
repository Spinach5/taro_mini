import { View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import { useState, useCallback } from "react";
import GridItem from "./GridItem";

const STORAGE_KEY_FEATURES = "settings_feature_toggles";
const ALWAYS_VISIBLE = [
  { url: "/modules/pages/exam/index", icon: "clipboard-text", text: "考试" },
  { url: "/modules/pages/student/index", icon: "finance", text: "成绩" },
  { url: "/modules/pages/empty_room/index", icon: "door-open", text: "空教室" },
  { url: "/modules/pages/muyu/index", icon: "instrument-triangle", text: "电子木鱼" },
  { url: "/modules/pages/plan/index", icon: "arrange-bring-forward", text: "培养方案" }
];

const TOGGLEABLE = [
  { key: "club", url: "/modules/pages/club/index", icon: "account-supervisor-circle", text: "社团" },
  { key: "food", url: "/modules/pages/food/index", icon: "food-variant", text: "美食" },
  { key: "book", url: "/modules/pages/book/index", icon: "book-open-page-variant", text: "书籍" },
  { key: "other", url: "/modules/pages/affair/index", icon: "plus-box-multiple-outline", text: "其他" },
];

function getStoredFeatures() {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY_FEATURES);
    if (stored && typeof stored === "object") return stored;
  } catch { /* ignore */ }
  return {};
}

export default function GridContainer({ className = "" }) {
  const [features, setFeatures] = useState(() => getStoredFeatures());

  const refreshFeatures = useCallback(() => {
    setFeatures(getStoredFeatures());
  }, []);

  useDidShow(() => {
    refreshFeatures();
  });

  const visibleItems = TOGGLEABLE.filter((item) => features[item.key] === true);
  const gridItems = [...ALWAYS_VISIBLE, ...visibleItems];

  return (
    <View
      className={`${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px",
        padding: "15px",
        background: "var(--color-bg-card, #fff)",
        borderRadius: "16px",
      }}
    >
      {gridItems.map((item, index) => (
        <GridItem
          key={index}
          url={item.url}
          icon={item.icon}
          text={item.text}
        />
      ))}
    </View>
  );
}
