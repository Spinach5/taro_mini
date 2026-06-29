import { View, Text, ScrollView } from '@tarojs/components';
import './index.css';

/**
 * 横向滚动分类标签栏
 * @param {Array<string|{label: string, value: string}>} categories - 分类列表
 * @param {string} activeKey - 当前选中值
 * @param {Function} onChange - 选中变化回调
 */
export default function CategoryTabs({
  categories = [],
  activeKey,
  onChange,
  className = '',
}) {
  const items = categories.map((cat) => {
    if (typeof cat === 'string') return { label: cat, value: cat };
    return cat;
  });

  return (
    <ScrollView
      scrollX
      showScrollbar={false}
      className={`category-tabs ${className}`}
      enhanced
      bounces={false}
    >
      <View className="category-tabs__list">
        {items.map((item) => (
          <View
            key={item.value}
            className={`category-tabs__item ${
              activeKey === item.value ? 'category-tabs__item--active' : ''
            }`}
            onClick={() => onChange?.(item.value)}
          >
            <Text className="category-tabs__text">{item.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
