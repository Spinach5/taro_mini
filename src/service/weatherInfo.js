// 向后兼容层，内部委托给 useWeatherStore
import useWeatherStore from "../store/useWeatherStore";

/**
 * WeatherManager 向后兼容包装器
 * 所有状态读写委托给 zustand useWeatherStore
 */
class WeatherManager {
  get _state() {
    return useWeatherStore.getState();
  }

  get latitude() { return this._state.latitude; }
  get longitude() { return this._state.longitude; }
  get city() { return this._state.city; }
  get locality() { return this._state.locality; }
  get province() { return this._state.province; }
  get weatherData() { return this._state.weatherData; }
  get fetchTime() { return this._state.fetchTime; }

  // 静态方法保持不变
  static getWeatherDescription(code) {
    const entry = WMO_CODE_MAP[code];
    return entry ? entry[0] : "未知";
  }

  static getWeatherIcon(code) {
    const entry = WMO_CODE_MAP[code];
    return entry ? entry[1] : "weather-cloudy-alert";
  }

  static getWeatherInfo(code) {
    const entry = WMO_CODE_MAP[code];
    return entry
      ? { description: entry[0], icon: entry[1] }
      : { description: "未知", icon: "weather-cloudy-alert" };
  }

  getValues() {
    return {
      latitude: this._state.latitude,
      longitude: this._state.longitude,
      city: this._state.city,
      locality: this._state.locality,
      province: this._state.province,
      weatherData: this._state.weatherData,
      fetchTime: this._state.fetchTime,
    };
  }

  async init(forceRefresh = false) {
    return this._state.init(forceRefresh);
  }

  async update() {
    return this._state.update();
  }

  getCurrentWeather() {
    return this._state.getCurrentWeather();
  }

  getCurrentTemperature() {
    return this._state.getCurrentTemperature();
  }

  getCurrentArea() {
    return this._state.getCurrentArea();
  }

  get24HourForecast() {
    return this._state.get24HourForecast();
  }

  getDailyForecast() {
    return this._state.getDailyForecast();
  }

  getCachedTime() {
    return this._state.fetchTime;
  }

  getWeatherData() {
    return this._state.weatherData;
  }

  // 兼容旧的缓存方法
  saveToCache() { /* zustand persist 自动处理 */ }
  loadFromCache() { /* zustand persist 自动处理 */ return true; }
  isCacheValid() {
    const ft = this._state.fetchTime;
    return ft ? Date.now() - ft < 30 * 60 * 1000 : false;
  }
}

// WMO code 映射（保留用于静态方法）
const WMO_CODE_MAP = {
  0: ["晴天", "weather-sunny"],
  1: ["大部晴朗", "weather-sunny"],
  2: ["多云", "weather-partly-cloudy"],
  3: ["阴天", "weather-cloudy"],
  45: ["有雾", "weather-fog"],
  48: ["有雾凇", "weather-fog"],
  51: ["小毛毛雨", "weather-rainy"],
  53: ["毛毛雨", "weather-rainy"],
  55: ["大毛毛雨", "weather-rainy"],
  61: ["小雨", "weather-rainy"],
  63: ["中雨", "weather-pouring"],
  65: ["大雨", "weather-pouring"],
  71: ["小雪", "weather-snowy"],
  73: ["中雪", "weather-snowy"],
  75: ["大雪", "weather-snowy"],
  80: ["阵雨", "weather-rainy"],
  81: ["中阵雨", "weather-pouring"],
  82: ["大阵雨", "weather-pouring"],
  85: ["小阵雪", "weather-snowy"],
  86: ["大阵雪", "weather-snowy"],
  95: ["雷暴", "weather-lightning"],
  96: ["雷暴伴小冰雹", "weather-lightning-rainy"],
  99: ["雷暴伴大冰雹", "weather-hail"],
};

const weatherManager = new WeatherManager();

export default weatherManager;
