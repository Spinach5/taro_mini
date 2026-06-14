// 根据环境判断使用代理还是直接请求
const isH5 = process.env.TARO_ENV === "h5";

// H5 环境使用代理，其他情况使用完整域名
export const API_BASE = {
	hbut:  isH5 ? "/hbut" : "https://jwxt.hbut.edu.cn",
	hbut_www: isH5 ? "/hbut_www" : "https://www.hbut.edu.cn",
	gitee:  isH5 ? "/gitee/" : "https://gitee.com/",
	ipapi :  isH5 ? "/ipapi" : "https://ipapi.co/",
	bigdata:  isH5 ? "/bigdata" : "https://api.bigdatacloud.net",
	open_meteo:  isH5 ? "/open_meteo" : "https://api.open-meteo.com/",
    server: isH5 ? "server" : "https://8.148.69.248/",
	captcha: isH5 ? "/captcha" : "https://captcha.chaoxing.com",
};
