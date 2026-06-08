# 天气页面设计文档

## 概述

在 `src/modules/pages/weather/` 实现天气信息页面，数据来源为 `weatherInfo.js`（WeatherManager 单例）。页面已在 `app.config.js` 中注册为子包页面。

## 整体布局

纵向滚动页面（ScrollView），从上到下依次为：

1. **顶部导航栏** — 复用 `uniform-page-header` 模式（返回箭头 + HeadStatus）
2. **当前天气卡片** — 中等信息密度
3. **逐时预报** — 横向 ScrollView 可左右滑动
4. **每日预报** — 纵向列表（含昨天 + 未来几天）

```
┌─────────────────────────────┐
│  ← 天气                     │
├─────────────────────────────┤
│  📍 湖北省 武汉市 洪山区       │
│         ☀️ 晴天              │
│           28°               │
│      最高 32°  最低 21°       │
│   💧 65%  🌬 12km/h  🌧 5%  │
├─────────────────────────────┤
│  逐时预报                     │
│  ┌────┬────┬────┬───→ 横滑  │
│  │现在│ 9时│10时│11时│      │
│  │ ☀️  │ ☀️  │ ⛅ │ ⛅ │      │
│  │28°│29°│30°│31°│      │
│  └────┴────┴────┴───→      │
├─────────────────────────────┤
│  每日预报                     │
│   昨天  ☁️ 多云  28°/22°     │
│   今天  ☀️ 晴天  32°/21°     │
│   明天  ⛅ 阴天  29°/20°     │
│   周三  🌧 小雨  25°/18°     │
│   ...                       │
└─────────────────────────────┘
```

## 数据流

```
weatherManager.init(forceRefresh)
  → getLocation() (已有)
  → getArea(lat, lon) (已有)
  → getWeather(lat, lon) + past_days=1 (需调整)
       ↓
  weatherManager 单例（缓存 30 分钟）
       ↓
  页面调用:
  - getCurrentArea()      → { city, locality, province }
  - getCurrentWeather()   → { temperature, humidity, weatherIcon, ... }
  - get24HourForecast()   → [{ time, temperature, weatherIcon, ... }]
  - getDailyForecast()    → [{ time, tempMax, tempMin, weatherIcon, ... }]
```

## 需要改动的文件

| 文件 | 改动内容 |
|------|----------|
| `src/modules/pages/weather/index.jsx` | 重写，实现完整天气页面组件 |
| `src/modules/pages/weather/index.scss` | 新建，天气页面全部样式 |
| `src/service/weatherInfo.js` | `init()` 方法增加 `past_days=1` 参数以获取昨天数据 |
| `src/utils/getWeather.js` | 无需改动（已包含 `past_days=1` 参数） |

## 组件结构

单文件组件 `Weather`（`index.jsx`），不拆分子组件（三个内容区域各自逻辑独立但不需要单独抽取）：

```
Weather/index.jsx
  ├─ SafeAreaView
  │   ├─ uniform-page-header（导航栏）
  │   ├─ 当前天气卡片（内联）
  │   ├─ 逐时预报（ScrollView scrollX）
  │   └─ 每日预报列表（纵向 map）
```

## 各区域详情

### 当前天气卡片

中等信息密度：
- 第一行：位置信息（省份 + 城市 + 区县，如"湖北省武汉市洪山区"）
- 第二行：天气图标 + 天气描述文字
- 第三行：大字温度（当前温度）
- 第四行：最高温度 / 最低温度
- 第五行：辅助信息（湿度 💧、风速 🌬、降雨概率 🌧），图标 + 数字

### 逐时预报

- 标题 "逐时预报"
- 横向 `ScrollView`（`scrollX`），内嵌 flex 横向排列
- 每项：时间（如"现在"/"9时"）+ 天气图标 + 温度
- 第一项显示为"现在"（当前时间所在小时）

### 每日预报

- 标题 "每日预报"
- 纵向列表，每行一天
- 每行：日期+星期 + 天气图标 + 天气描述 + 温度条（min~max 渐变） + 高低温数字
- "昨天"行标注为灰色区分
- 今天标注为"今天"

## 状态处理

| 状态 | 表现 |
|------|------|
| 加载中 | 居中显示 `<Loading />` |
| 首次加载失败 | 显示"加载失败"文字 + 重试按钮 |
| 有缓存但刷新失败 | Toast 提示"刷新失败"，继续展示旧数据 |
| 下拉刷新 | 调用 `weatherManager.update()`，停止 pull-down 动画 |
| 无定位权限 | 位置显示"--"，天气数据可能无法获取，显示错误状态 |

## 天气图标

使用 `weatherInfo.js` 中 `WMO_CODE_MAP` 定义的 Material Design Icon 名称（如 `weather-sunny`、`weather-partly-cloudy`、`weather-rainy` 等）。渲染方式：使用 `taro-icons` 库的 `MaterialCommunityIcons` 组件，与首页 `src/pages/index/index.jsx:36` 中的用法一致，直接将 `weatherIcon` 作为 `name` prop 传入。

## 样式规范

- 复用现有 `bora` 类名（圆角）
- 复用 `uniform-page-header`（导航栏）
- 天气卡片背景白色/半透明，圆角，轻微阴影
- 温度条使用渐变色（蓝色低温 → 橙色高温）
- 整体配色与 SafeAreaView 的蓝色渐变背景协调

## 边界情况

- 天气数据中 `hourly.time` 数组长度不足 24 项时，显示实际可用项数
- `daily.time` 数组需检查是否包含昨天数据（通过 `past_days` 参数保证）
- 温度值可能为 null（API 缺失），显示为 "--"
- 降水概率可能为 null，显示为 "--"
