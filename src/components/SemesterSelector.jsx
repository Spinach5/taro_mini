import { Picker, View } from "@tarojs/components";

export default function SemesterPicker({
  semesterList = [],
  currentSemester,
  onChange,
  children,
}) {
  // 确保 range 是字符串数组（防御性拷贝）
  const rangeList = Array.isArray(semesterList) ? semesterList : [];

  // 计算当前索引，若不在列表中则回退到 0
  const index = rangeList.indexOf(currentSemester);
  const safeIndex = index >= 0 ? index : 0;

  const handleChange = (e) => {
    const idx = e.detail.value;
    const selected = rangeList[idx];
    // 只当选中的值有效时才触发外部回调
    if (selected !== undefined) {
      onChange?.(selected);
    }
  };

  return (
    <Picker
      mode="selector"
      range={rangeList}
      value={safeIndex}
      onChange={handleChange}
    >
      {children || (
        <View className="semester-picker-trigger">
          {currentSemester || "选择学期"}
        </View>
      )}
    </Picker>
  );
}
