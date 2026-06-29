import { View, Input } from '@tarojs/components';
import { useState, useEffect } from 'react';
import { AtIcon } from 'taro-ui';
import { useDebounce } from '../../../hooks';
import './index.css';

/**
 * 统一搜索栏组件
 */
export default function SearchBar({
  value: controlledValue,
  placeholder = '搜索',
  onChange,
  onSearch = null,
  debounce: debounceMs = 0,
  showSearchIcon = true,
  className = '',
}) {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const debouncedValue = useDebounce(internalValue, debounceMs);

  // 受控模式
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // 防抖回调
  useEffect(() => {
    if (debounceMs > 0 && onChange) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, debounceMs, onChange]);

  const handleInput = (e) => {
    const val = e.detail.value;
    setInternalValue(val);
    if (debounceMs === 0 && onChange) {
      onChange(val);
    }
  };

  const handleConfirm = () => {
    onSearch?.(internalValue);
  };

  return (
    <View className={`search-bar ${className}`}>
      <View className="search-bar__wrap">
        {showSearchIcon && (
          <AtIcon value="search" size={16} color="#999" />
        )}
        <Input
          className="search-bar__input"
          placeholder={placeholder}
          value={internalValue}
          onInput={handleInput}
          onConfirm={handleConfirm}
          confirmType="search"
        />
      </View>
    </View>
  );
}
