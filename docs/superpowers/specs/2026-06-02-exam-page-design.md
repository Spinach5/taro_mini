# 考试信息页面设计

## 概述

实现 `src/modules/pages/exam/index.jsx` 考试信息页面，展示当前学期的考试安排列表。

## 页面结构

```
SafeAreaView
├── Header（← 返回 + "考试" 标题）
├── 学期选择器（Picker，复用 SemesterSelector 组件）
└── 考试卡片列表
    └── 每张卡片:
        ├── 科目名（顶部，黑色加粗大号字体）
        ├── 教室、时间、方式、座位（左对齐，常规字体）
        └── 状态标签（右下角，斜体大号字体）
```

## 数据源

- **学期列表**: `src/service/hbut/CurrentSemester.js` → `getSemesterList()`，返回 `string[]`（如 `["2024-2025-1", "2024-2025-2", ...]`），默认选中最后一个（当前学期）
- **考试信息**: `src/service/hbut/ExamInfo.js` → `getExamInfo(semester)`，返回 `{ total, exams: [{ kcmc, jsmc, kssj, ksfs, kspcmc, zwh }] }`

## 卡片字段

| 数据字段 | 显示 |
|---------|------|
| `kcmc` | 科目名（顶部，黑色加粗大号） |
| `jsmc` | 教室 |
| `kssj` | 考试时间（解析 `"2026-03-09 18:30~20:30"` 格式化显示） |
| `ksfs` | 考试方式 |
| `zwh` | 座位号 |

## 状态逻辑

解析 `kssj` 格式 `"YYYY-MM-DD HH:mm~HH:mm"`，与 `Date.now()` 对比：

| 条件 | 状态 | 颜色 |
|------|------|------|
| 当前 < 开始时间 | 待开始 | 绿色 |
| 开始 ≤ 当前 ≤ 结束 | 进行中 | 黄色 |
| 当前 > 结束时间 | 已结束 | 灰色 |

## 组件复用

- `SemesterSelector` — 已有组件，Picker 模式选择学期
- `SafeAreaView` — 页面容器
- `HeadStatus` — 页面标题

## 样式

- SCSS 文件: `src/modules/pages/exam/index.scss`
- 卡片: 白色背景、圆角、阴影
- 整体风格与项目现有页面一致

## 状态处理

- **加载中**: 显示加载指示器
- **空数据**: 显示空状态提示
- **错误**: Toast 提示错误信息
