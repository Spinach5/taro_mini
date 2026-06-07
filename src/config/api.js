// 根据环境判断使用代理还是直接请求
const isH5 = process.env.TARO_ENV === "h5";

// H5 环境使用代理，其他情况使用完整域名
export const API_BASE = {
	hbut:  isH5 ? "/hbut" : "https://jwxt.hbut.edu.cn",
	opendiff:  isH5 ? "/opendiff" : "https://api.zxionf.top",
	gitee:  isH5 ? "/gitee/" : "https://gitee.com/",
	ipapi :  isH5 ? "/ipapi" : "https://ipapi.co/",
	bigdata:  isH5 ? "/bigdata" : "https://api.bigdatacloud.net/",
	open_meteo:  isH5 ? "/open_meteo" : "https://api.open-meteo.com/",

};
