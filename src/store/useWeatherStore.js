import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import taroStorage from './storage';
import getLocation from '../utils/platform/getLocation';
import getArea from '../utils/platform/getArea';
import getWeather from '../utils/platform/getWeather';
import runtimeLogger from '../utils/common/runtimeLogger';

// WMO weather code → [中文描述, Material Design Icon]
const WMO_CODE_MAP = {
  0: ['晴天', 'weather-sunny'],
  1: ['大部晴朗', 'weather-sunny'],
  2: ['多云', 'weather-partly-cloudy'],
  3: ['阴天', 'weather-cloudy'],
  45: ['有雾', 'weather-fog'],
  48: ['有雾凇', 'weather-fog'],
  51: ['小毛毛雨', 'weather-rainy'],
  53: ['毛毛雨', 'weather-rainy'],
  55: ['大毛毛雨', 'weather-rainy'],
  61: ['小雨', 'weather-rainy'],
  63: ['中雨', 'weather-pouring'],
  65: ['大雨', 'weather-pouring'],
  71: ['小雪', 'weather-snowy'],
  73: ['中雪', 'weather-snowy'],
  75: ['大雪', 'weather-snowy'],
  80: ['阵雨', 'weather-rainy'],
  81: ['中阵雨', 'weather-pouring'],
  82: ['大阵雨', 'weather-pouring'],
  85: ['小阵雪', 'weather-snowy'],
  86: ['大阵雪', 'weather-snowy'],
  95: ['雷暴', 'weather-lightning'],
  96: ['雷暴伴小冰雹', 'weather-lightning-rainy'],
  99: ['雷暴伴大冰雹', 'weather-hail'],
};

function getWeatherInfo(code) {
  const entry = WMO_CODE_MAP[code];
  return entry
    ? { description: entry[0], icon: entry[1] }
    : { description: '未知', icon: 'weather-cloudy-alert' };
}

const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

const useWeatherStore = create(
  persist(
    (set, get) => ({
      latitude: null,
      longitude: null,
      city: '-',
      locality: '-',
      province: '-',
      weatherData: null,
      fetchTime: null,
      loading: false,
      error: null,

      /** 初始化天气（缓存有效则跳过） */
      init: async (forceRefresh = false) => {
        const state = get();

        // 检查缓存
        if (!forceRefresh && state.fetchTime && Date.now() - state.fetchTime < CACHE_TTL) {
          return;
        }

        set({ loading: true, error: null });

        try {
          const location = await getLocation();
          set({ latitude: location.latitude, longitude: location.longitude });

          const [areaResult, weatherResult] = await Promise.allSettled([
            getArea(location.latitude, location.longitude),
            getWeather(location.latitude, location.longitude),
          ]);

          const updates = {};

          if (areaResult.status === 'fulfilled') {
            const area = areaResult.value;
            updates.province = area.principalSubdivision || '-';
            updates.city = area.city || '-';
            updates.locality = area.locality || '-';
          } else {
            runtimeLogger.error('WeatherStore', '获取位置信息失败', areaResult.reason);
          }

          if (weatherResult.status === 'fulfilled') {
            updates.weatherData = weatherResult.value;
            updates.fetchTime = Date.now();
          } else {
            runtimeLogger.error('WeatherStore', '获取天气数据失败', weatherResult.reason);
            if (!state.weatherData) {
              throw new Error('天气数据获取失败，且无缓存可用');
            }
          }

          set({ ...updates, loading: false });
        } catch (error) {
          runtimeLogger.error('WeatherStore', '初始化天气数据失败', error);
          set({ loading: false, error });
          throw error;
        }
      },

      /** 强制更新 */
      update: async () => {
        return get().init(true);
      },

      /** 获取当前天气 */
      getCurrentWeather: () => {
        const { weatherData } = get();
        if (!weatherData || !weatherData.current) return null;
        const { current } = weatherData;
        const info = getWeatherInfo(current.weather_code);
        return {
          temperature: current.temperature_2m,
          humidity: current.relative_humidity_2m,
          weatherCode: current.weather_code,
          weatherDescription: info.description,
          weatherIcon: info.icon,
          cloudCover: current.cloud_cover,
          windSpeed: current.wind_speed_10m,
          windDirection: current.wind_direction_10m,
          precipitation: current.precipitation,
          pressure: current.pressure_msl,
          time: current.time,
        };
      },

      /** 获取当前温度 */
      getCurrentTemperature: () => {
        const weatherData = get().weatherData;
        if (!weatherData || !weatherData.current) return null;
        const temp = weatherData.current.temperature_2m;
        return (temp !== null && temp !== undefined) ? temp : null;
      },

      /** 获取位置信息 */
      getCurrentArea: () => {
        const { city, locality, province } = get();
        return { city, locality, province };
      },

      /** 获取 24 小时预报 */
      get24HourForecast: () => {
        const { weatherData } = get();
        if (!weatherData || !weatherData.hourly) return [];
        const { time, temperature_2m, weather_code, precipitation_probability } = weatherData.hourly;
        if (!time || !Array.isArray(time) || time.length === 0) return [];

        const now = new Date();
        let startIndex = 0;
        for (let i = 0; i < time.length; i++) {
          if (new Date(time[i]) >= now) { startIndex = i; break; }
        }

        const endIndex = Math.min(startIndex + 24, time.length);
        const forecast = [];
        for (let i = startIndex; i < endIndex; i++) {
          const info = getWeatherInfo(weather_code && weather_code[i]);
          forecast.push({
            time: time[i],
            temperature: (temperature_2m && temperature_2m[i] !== null && temperature_2m[i] !== undefined) ? temperature_2m[i] : null,
            weatherCode: (weather_code && weather_code[i] !== null && weather_code[i] !== undefined) ? weather_code[i] : null,
            weatherDescription: info.description,
            weatherIcon: info.icon,
            precipitationProbability: (precipitation_probability && precipitation_probability[i] !== null && precipitation_probability[i] !== undefined) ? precipitation_probability[i] : null,
          });
        }
        return forecast;
      },

      /** 获取每日预报 */
      getDailyForecast: () => {
        const { weatherData } = get();
        if (!weatherData || !weatherData.daily) return [];
        const { time, weather_code, temperature_2m_max, temperature_2m_min } = weatherData.daily;
        if (!time || !Array.isArray(time) || time.length === 0) return [];

        return time.map((t, i) => {
          const info = getWeatherInfo(weather_code && weather_code[i]);
          return {
            time: t,
            weatherCode: (weather_code && weather_code[i] !== null && weather_code[i] !== undefined) ? weather_code[i] : null,
            weatherDescription: info.description,
            weatherIcon: info.icon,
            tempMax: (temperature_2m_max && temperature_2m_max[i] !== null && temperature_2m_max[i] !== undefined) ? temperature_2m_max[i] : null,
            tempMin: (temperature_2m_min && temperature_2m_min[i] !== null && temperature_2m_min[i] !== undefined) ? temperature_2m_min[i] : null,
          };
        });
      },
    }),
    {
      name: 'weather-store',
      storage: taroStorage,
      partialize: (state) => ({
        latitude: state.latitude,
        longitude: state.longitude,
        city: state.city,
        locality: state.locality,
        province: state.province,
        weatherData: state.weatherData,
        fetchTime: state.fetchTime,
      }),
    },
  ),
);

export default useWeatherStore;
