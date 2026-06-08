# Weather Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a weather info page at `src/modules/pages/weather/` with current weather, hourly forecast (horizontal scroll), and daily forecast (vertical list including yesterday).

**Architecture:** Single React component (`Weather`) that initializes `weatherManager` on mount, reads formatted data via its getter methods, and renders three sections inside a vertical `ScrollView`. Weather icons use `MaterialCommunityIcons` from `taro-icons`. The data layer (`weatherInfo.js` + `getWeather.js`) already supports `past_days=1` — no service changes needed.

**Tech Stack:** Taro 4.2, React 18, SASS, taro-icons (MaterialCommunityIcons), taro-ui (AtIcon, Loading spinner)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/modules/pages/weather/index.jsx` | Rewrite | Page component: data fetch, state, render all 3 sections |
| `src/modules/pages/weather/index.scss` | Create | All weather page styles |
| `src/modules/pages/weather/index.config.js` | Keep | Page config (already correct) |

---

### Task 1: Create SCSS stylesheet

**Files:**
- Create: `src/modules/pages/weather/index.scss`

- [ ] **Step 1: Write the complete SCSS file**

```scss
// Weather page styles

.weather-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
}

// ========== Current Weather Card ==========
.current-weather-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 24px;
  margin: 16px 16px 0;
  padding: 30px 20px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.weather-location {
  font-size: 26px;
  color: #666;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.weather-location-icon {
  font-size: 22px;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.weather-desc {
  font-size: 32px;
  color: #333;
  font-weight: 500;
}

.weather-temp-current {
  font-size: 96px;
  font-weight: 300;
  color: #1a1a1a;
  line-height: 1;
  margin-bottom: 8px;
}

.weather-hi-lo {
  display: flex;
  gap: 32px;
  margin-bottom: 20px;
}

.weather-hi-lo-item {
  font-size: 26px;
  color: #666;
}

.weather-hi-lo-label {
  color: #999;
}

.weather-extra {
  display: flex;
  justify-content: space-around;
  width: 100%;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.weather-extra-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.weather-extra-icon {
  font-size: 24px;
  color: #999;
}

.weather-extra-value {
  font-size: 24px;
  color: #555;
}

.weather-extra-label {
  font-size: 20px;
  color: #aaa;
}

// ========== Section Header ==========
.section-header {
  padding: 28px 32px 14px;
  font-size: 30px;
  font-weight: 600;
  color: #1a1a1a;
}

// ========== Hourly Forecast ==========
.hourly-scroll {
  white-space: nowrap;
}

.hourly-list {
  display: flex;
  flex-direction: row;
  padding: 0 16px 10px;
}

.hourly-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 18px;
  min-width: 120px;
  gap: 8px;
  flex-shrink: 0;
}

.hourly-time {
  font-size: 24px;
  color: #999;
}

.hourly-temp {
  font-size: 28px;
  color: #333;
  font-weight: 500;
}

// ========== Daily Forecast ==========
.daily-list {
  padding: 0 16px 40px;
}

.daily-item {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 20px;
  margin-bottom: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.daily-item-yesterday {
  opacity: 0.55;
}

.daily-date {
  width: 120px;
  flex-shrink: 0;
}

.daily-day {
  font-size: 28px;
  color: #333;
  font-weight: 500;
}

.daily-date-sub {
  font-size: 22px;
  color: #aaa;
}

.daily-icon-wrap {
  width: 70px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.daily-desc {
  flex: 1;
  font-size: 26px;
  color: #666;
  padding: 0 12px;
}

.daily-temp-bar {
  width: 100px;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #47a5fd, #f0ad4e);
  flex-shrink: 0;
  margin: 0 12px;
  position: relative;
}

.daily-temps {
  width: 110px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.daily-temp-high {
  font-size: 26px;
  color: #e74c3c;
  font-weight: 500;
}

.daily-temp-low {
  font-size: 26px;
  color: #47a5fd;
  font-weight: 500;
}

// ========== Error state ==========
.error-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 40px;
}

.error-text {
  font-size: 28px;
  color: #999;
}

.retry-btn {
  padding: 14px 48px;
  background: #47a5fd;
  color: #fff;
  border-radius: 40px;
  font-size: 28px;
}
```

- [ ] **Step 2: Commit**

```bash
git add -f src/modules/pages/weather/index.scss
git commit -m "feat: add weather page stylesheet"
```

---

### Task 2: Rewrite weather page component

**Files:**
- Modify: `src/modules/pages/weather/index.jsx` (complete rewrite)

- [ ] **Step 1: Write the full page component**

```jsx
import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { AtIcon } from "taro-ui";
import { MaterialCommunityIcons } from "taro-icons";
import SafeAreaView from "../../../components/SafeAreaView";
import Loading from "../../../components/Loading";
import HeadStatus from "../../../components/HeadStatus";
import weatherManager from "../../../service/weatherInfo";
import "./index.scss";

const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** Format a date string to "M月D日" */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** Get day label: "昨天", "今天", "明天", or weekday name */
function getDayLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  // reset hours to compare dates only
  const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = (targetDate - todayDate) / (1000 * 60 * 60 * 24);

  if (diff === -1) return "昨天";
  if (diff === 0) return "今天";
  if (diff === 1) return "明天";
  return WEEKDAY_NAMES[d.getDay()];
}

/** Format hour from date string: "9时" for 9:00, or "现在" if matches current hour */
function formatHour(dateStr, currentHour) {
  const d = new Date(dateStr);
  const hour = d.getHours();
  if (hour === currentHour) return "现在";
  return `${hour}时`;
}

/** Format wind direction degrees to Chinese */
function windDirectionText(degrees) {
  if (degrees == null) return "--";
  const dirs = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  const idx = Math.round(degrees / 45) % 8;
  return dirs[idx];
}

export default function Weather() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [area, setArea] = useState({ province: "--", city: "--", locality: "--" });
  const [current, setCurrent] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [currentHour, setCurrentHour] = useState(new Date().getHours());

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setError(false);
      if (!forceRefresh) {
        setLoading(true);
      }

      await weatherManager.init(forceRefresh);

      const areaData = weatherManager.getCurrentArea();
      setArea(areaData);

      const currentData = weatherManager.getCurrentWeather();
      setCurrent(currentData);

      const hourlyData = weatherManager.get24HourForecast();
      setHourly(hourlyData);

      const dailyData = weatherManager.getDailyForecast();
      setDaily(dailyData);

      setCurrentHour(new Date().getHours());
      setLoading(false);
    } catch (err) {
      console.error("获取天气数据失败", err);
      // If we already have cached data, keep showing it
      const cachedArea = weatherManager.getCurrentArea();
      if (cachedArea.city && cachedArea.city !== "-") {
        setArea(cachedArea);
        setCurrent(weatherManager.getCurrentWeather());
        setHourly(weatherManager.get24HourForecast());
        setDaily(weatherManager.getDailyForecast());
        setLoading(false);
        if (forceRefresh) {
          Taro.showToast({ title: "刷新失败", icon: "none" });
        }
      } else {
        setLoading(false);
        setError(true);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useDidShow(() => {
    // Refresh data when page becomes visible if cache expired
    if (!weatherManager.isCacheValid()) {
      fetchData();
    }
  });

  usePullDownRefresh(() => {
    fetchData(true).finally(() => {
      Taro.stopPullDownRefresh();
    });
  });

  // ====== Loading state ======
  if (loading) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <AtIcon
            value="arrow-left"
            color="#ffffff"
            onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
          />
          <HeadStatus text="天气" />
        </View>
        <Loading />
      </SafeAreaView>
    );
  }

  // ====== Error state (no cached data) ======
  if (error) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <AtIcon
            value="arrow-left"
            color="#ffffff"
            onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
          />
          <HeadStatus text="天气" />
        </View>
        <View className="error-view">
          <Text className="error-text">加载失败</Text>
          <View className="retry-btn" onClick={() => fetchData(true)}>
            <Text>重试</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ====== Main content ======
  const locationText = [area.province, area.city, area.locality]
    .filter((s) => s && s !== "-")
    .join(" ");

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
        />
        <HeadStatus text="天气" />
      </View>

      <ScrollView scrollY className="weather-page">
        {/* ===== Current Weather Card ===== */}
        <View className="current-weather-card bora">
          {/* Location */}
          <View className="weather-location">
            <MaterialCommunityIcons
              name="map-marker"
              color="#999"
              size={22}
            />
            <Text>{locationText || "--"}</Text>
          </View>

          {/* Weather icon + description */}
          {current && (
            <>
              <View className="weather-main">
                <MaterialCommunityIcons
                  name={current.weatherIcon}
                  color="#47a5fd"
                  size={48}
                />
                <Text className="weather-desc">{current.weatherDescription}</Text>
              </View>

              {/* Current temperature */}
              <Text className="weather-temp-current">
                {current.temperature != null ? `${Math.round(current.temperature)}°` : "--°"}
              </Text>

              {/* Hi/Lo from daily forecast */}
              {daily.length > 0 && (
                <View className="weather-hi-lo">
                  <Text className="weather-hi-lo-item">
                    <Text className="weather-hi-lo-label">最高 </Text>
                    {daily[0].tempMax != null ? `${Math.round(daily[0].tempMax)}°` : "--°"}
                  </Text>
                  <Text className="weather-hi-lo-item">
                    <Text className="weather-hi-lo-label">最低 </Text>
                    {daily[0].tempMin != null ? `${Math.round(daily[0].tempMin)}°` : "--°"}
                  </Text>
                </View>
              )}

              {/* Extra info row */}
              <View className="weather-extra">
                <View className="weather-extra-item">
                  <MaterialCommunityIcons name="water-percent" color="#47a5fd" size={24} />
                  <Text className="weather-extra-value">
                    {current.humidity != null ? `${current.humidity}%` : "--"}
                  </Text>
                  <Text className="weather-extra-label">湿度</Text>
                </View>
                <View className="weather-extra-item">
                  <MaterialCommunityIcons name="weather-windy" color="#999" size={24} />
                  <Text className="weather-extra-value">
                    {current.windSpeed != null
                      ? `${current.windSpeed} km/h`
                      : "--"}
                  </Text>
                  <Text className="weather-extra-label">
                    {windDirectionText(current.windDirection)}
                  </Text>
                </View>
                <View className="weather-extra-item">
                  <MaterialCommunityIcons name="weather-rainy" color="#47a5fd" size={24} />
                  <Text className="weather-extra-value">
                    {current.precipitation != null
                      ? `${current.precipitation} mm`
                      : "--"}
                  </Text>
                  <Text className="weather-extra-label">降水</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ===== Hourly Forecast ===== */}
        {hourly.length > 0 && (
          <>
            <View className="section-header">
              <Text>逐时预报</Text>
            </View>
            <ScrollView scrollX className="hourly-scroll">
              <View className="hourly-list">
                {hourly.map((item, idx) => (
                  <View className="hourly-item" key={item.time || idx}>
                    <Text className="hourly-time">
                      {formatHour(item.time, currentHour)}
                    </Text>
                    <MaterialCommunityIcons
                      name={item.weatherIcon || "weather-cloudy-alert"}
                      color="#47a5fd"
                      size={30}
                    />
                    <Text className="hourly-temp">
                      {item.temperature != null ? `${Math.round(item.temperature)}°` : "--°"}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {/* ===== Daily Forecast ===== */}
        {daily.length > 0 && (
          <>
            <View className="section-header">
              <Text>每日预报</Text>
            </View>
            <View className="daily-list">
              {daily.map((item, idx) => {
                const isYesterday = getDayLabel(item.time) === "昨天";
                return (
                  <View
                    className={`daily-item bora ${isYesterday ? "daily-item-yesterday" : ""}`}
                    key={item.time || idx}
                  >
                    <View className="daily-date">
                      <Text className="daily-day">{getDayLabel(item.time)}</Text>
                      <Text className="daily-date-sub">{formatDate(item.time)}</Text>
                    </View>
                    <View className="daily-icon-wrap">
                      <MaterialCommunityIcons
                        name={item.weatherIcon || "weather-cloudy-alert"}
                        color="#47a5fd"
                        size={32}
                      />
                    </View>
                    <Text className="daily-desc">{item.weatherDescription || "--"}</Text>
                    <View className="daily-temp-bar" />
                    <View className="daily-temps">
                      <Text className="daily-temp-high">
                        {item.tempMax != null ? `${Math.round(item.tempMax)}°` : "--°"}
                      </Text>
                      <Text className="daily-temp-low">
                        {item.tempMin != null ? `${Math.round(item.tempMin)}°` : "--°"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Remove the old `index.css` import reference**

The old file imported `./index.css` — the new component imports `./index.scss` instead. Also delete the old empty `index.css` file.

```bash
rm src/modules/pages/weather/index.css
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/pages/weather/index.jsx
git rm src/modules/pages/weather/index.css
git commit -m "feat: implement weather page with current, hourly, and daily forecast"
```
