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
            <View className="hourly-card bora">
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
            </View>
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
                    <View className="daily-temps">
                      <Text className="daily-temp-low">
                        {item.tempMin != null ? `${Math.round(item.tempMin)}°` : "--°"}
                      </Text>
                      <Text className="daily-temp-high">
                        {item.tempMax != null ? `${Math.round(item.tempMax)}°` : "--°"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ===== Data Source ===== */}
        <View className="data-source">
          <Text className="data-source-text">数据来源: open-meteo</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
