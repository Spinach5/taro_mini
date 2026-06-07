import cacheManager from "../utils/cache";
import getLocation from "../utils/getLocation";
import getArea from "../utils/getArea";
import getWeather from "../utils/getWeather";
import runtimeLogger from "../utils/runtimeLogger";

// WMO weather code → Chinese description
// WMO weather code → [中文描述, Material Design Icon]
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

class WeatherManager {
	constructor() {
		this.latitude = null;
		this.longitude = null;
		this.city = "-";
		this.locality = "-";
		this.province = "-";
		this.weatherData = null;
		this.fetchTime = null;
		this.cacheKey = "weatherInfo";
		this.CACHE_TTL = 30 * 60 * 1000; // 30 minutes
	}

	// 持久化到缓存
	saveToCache() {
		const data = {
			latitude: this.latitude,
			longitude: this.longitude,
			city: this.city,
			locality: this.locality,
			province: this.province,
			weatherData: this.weatherData,
			fetchTime: this.fetchTime,
		};
		cacheManager.set(this.cacheKey, data);
	}

	// 从缓存加载
	loadFromCache() {
		const cached = cacheManager.get(this.cacheKey);
		if (cached) {
			this.latitude = cached.latitude ?? null;
			this.longitude = cached.longitude ?? null;
			this.city = cached.city || "-";
			this.locality = cached.locality || "-";
			this.province = cached.province || "-";
			this.weatherData = cached.weatherData ?? null;
			this.fetchTime = cached.fetchTime ?? null;
			return true;
		}
		return false;
	}

	// 缓存是否在有效期内
	isCacheValid() {
		if (!this.fetchTime) return false;
		return Date.now() - this.fetchTime < this.CACHE_TTL;
	}

	// 根据 WMO code 获取天气描述
	static getWeatherDescription(code) {
		const entry = WMO_CODE_MAP[code];
		return entry ? entry[0] : "未知";
	}

	// 根据 WMO code 获取天气图标
	static getWeatherIcon(code) {
		const entry = WMO_CODE_MAP[code];
		return entry ? entry[1] : "weather-cloudy-alert";
	}

	// 根据 WMO code 获取完整天气信息（描述 + 图标）
	static getWeatherInfo(code) {
		const entry = WMO_CODE_MAP[code];
		return entry
			? { description: entry[0], icon: entry[1] }
			: { description: "未知", icon: "weather-cloudy-alert" };
	}

	// 获取当前所有值
	getValues() {
		return {
			latitude: this.latitude,
			longitude: this.longitude,
			city: this.city,
			locality: this.locality,
			province: this.province,
			weatherData: this.weatherData,
			fetchTime: this.fetchTime,
		};
	}

	/**
	 * 初始化 / 刷新天气数据
	 * @param {boolean} forceRefresh 是否强制刷新（忽略缓存）
	 * @returns {Promise<Object>} 天气数据
	 */
	async init(forceRefresh = false) {
		// 非强制刷新时，先尝试从缓存加载
		if (!forceRefresh) {
			this.loadFromCache();
			if (this.isCacheValid()) {
				console.log("[WeatherManager] 缓存有效，跳过请求");
				return this.getValues();
			}
		}

		try {
			// Step 1: 获取定位
			console.log("[WeatherManager] 获取定位...");
			const location = await getLocation();
			this.latitude = location.latitude;
			this.longitude = location.longitude;
			console.log(`[WeatherManager] 定位成功: ${this.latitude}, ${this.longitude}`);

			// Step 2: 并行获取位置信息和天气
			console.log("[WeatherManager] 获取位置信息和天气...");
			const [areaResult, weatherResult] = await Promise.allSettled([
				getArea(this.latitude, this.longitude),
				getWeather(this.latitude, this.longitude),
			]);

			// 处理位置信息
			if (areaResult.status === "fulfilled") {
				const area = areaResult.value;
				this.province = area.principalSubdivision || "-";
				this.city = area.city || "-";
				this.locality = area.locality || "-";
				console.log(`[WeatherManager] 位置解析成功: ${this.province} ${this.city} ${this.locality}`);
			} else {
				runtimeLogger.error("WeatherManager", "获取位置信息失败", areaResult.reason);
				// 保留旧缓存中的位置信息或默认值
			}

			// 处理天气数据
			if (weatherResult.status === "fulfilled") {
				this.weatherData = weatherResult.value;
				this.fetchTime = Date.now();
				console.log("[WeatherManager] 天气数据获取成功");
			} else {
				runtimeLogger.error("WeatherManager", "获取天气数据失败", weatherResult.reason);
				if (!this.weatherData) {
					throw new Error("天气数据获取失败，且无缓存可用");
				}
				console.warn("[WeatherManager] 天气请求失败，使用过期缓存数据");
			}

			// 持久化
			this.saveToCache();
			return this.getValues();
		} catch (error) {
			runtimeLogger.error("WeatherManager", "初始化天气数据失败", error);
			throw error;
		}
	}

	/** 强制刷新天气数据 */
	async update() {
		return this.init(true);
	}

	/** 获取当前天气 */
	getCurrentWeather() {
		if (!this.weatherData?.current) return null;
		const { current } = this.weatherData;
		const info = WeatherManager.getWeatherInfo(current.weather_code);
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
	}

	/** 获取当前温度 */
	getCurrentTemperature() {
		return this.weatherData?.current?.temperature_2m ?? null;
	}

	/** 获取位置信息 */
	getCurrentArea() {
		return {
			city: this.city,
			locality: this.locality,
			province: this.province,
		};
	}

	/**
	 * 获取未来 24 小时天气预报
	 * @returns {Array<{time: string, temperature: number, weatherCode: number, weatherDescription: string, precipitationProbability: number}>}
	 */
	get24HourForecast() {
		if (!this.weatherData?.hourly) return [];

		const { time, temperature_2m, weather_code, precipitation_probability } = this.weatherData.hourly;
		if (!time || !Array.isArray(time) || time.length === 0) return [];

		// 找到 >= 当前时间的第一个索引
		const now = new Date();
		let startIndex = 0;
		for (let i = 0; i < time.length; i++) {
			if (new Date(time[i]) >= now) {
				startIndex = i;
				break;
			}
		}

		// 截取最多 24 项
		const endIndex = Math.min(startIndex + 24, time.length);
		const forecast = [];
		for (let i = startIndex; i < endIndex; i++) {
			const info = WeatherManager.getWeatherInfo(weather_code?.[i]);
			forecast.push({
				time: time[i],
				temperature: temperature_2m?.[i] ?? null,
				weatherCode: weather_code?.[i] ?? null,
				weatherDescription: info.description,
				weatherIcon: info.icon,
				precipitationProbability: precipitation_probability?.[i] ?? null,
			});
		}

		return forecast;
	}

	/**
	 * 获取每日天气预报（昨天 + 今天 + 未来几天）
	 * @returns {Array<{time: string, weatherCode: number, weatherDescription: string, tempMax: number, tempMin: number}>}
	 */
	getDailyForecast() {
		if (!this.weatherData?.daily) return [];

		const { time, weather_code, temperature_2m_max, temperature_2m_min } = this.weatherData.daily;
		if (!time || !Array.isArray(time) || time.length === 0) return [];

		const forecast = [];
		for (let i = 0; i < time.length; i++) {
			const info = WeatherManager.getWeatherInfo(weather_code?.[i]);
			forecast.push({
				time: time[i],
				weatherCode: weather_code?.[i] ?? null,
				weatherDescription: info.description,
				weatherIcon: info.icon,
				tempMax: temperature_2m_max?.[i] ?? null,
				tempMin: temperature_2m_min?.[i] ?? null,
			});
		}

		return forecast;
	}

	/** 获取缓存时间戳 */
	getCachedTime() {
		return this.fetchTime;
	}

	/** 获取完整原始天气数据 */
	getWeatherData() {
		return this.weatherData;
	}
}

const weatherManager = new WeatherManager();
// 初始化时从缓存加载已有数据
weatherManager.loadFromCache();

export default weatherManager;
