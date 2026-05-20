import { View } from '@tarojs/components'
import { useState } from 'react'
import './CategoryFilter.css'

/**
 * 分类选择器组件（单选）
 *
 * @param {Object} props - 组件属性
 * @param {string} [props.className] - 自定义类名（可选）
 * @param {Array<{id: string|number, name: string}>} props.categories - 分类列表，每项包含 id 和 name
 * @param {Function} props.onChange - 选中分类变化时的回调，参数为选中项的 id
 * @param {string} [props.allText] - 如果提供，会在分类列表最前面添加一个“全部”选项，其 id 通常为 'all' 或 ''，根据业务自行处理
 * @returns {JSX.Element} 分类选择器组件
 */

export default function CategoryFilter({
  className,
  categories = [],      // 分类列表，例如 [{ id: '1', name: '摄影社' }, ...]
  onChange,             // 切换回调 (id) => void
  allText               // '全部'
}) {
  const [currentActiveId, setCurrentActive] = useState(-1)
  const allcategories = allText ? [{ id: -1, name: allText }, ...categories] : categories
  return (
    <View className={`category-filter ${className}`}>
      {allcategories.map((cat) => (
        <View
          key={cat.id}
          className={`category-tab ${currentActiveId === cat.id ? 'active' : ''}`}
          onClick={() => {
            setCurrentActive(cat.id)
            onChange?.(cat.id)
          }}
        >
          {cat.name}
        </View>
      ))}
    </View>
  )
}