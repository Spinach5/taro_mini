// 根据环境判断使用代理还是直接请求
const isH5 = process.env.TARO_ENV === "h5";

// H5 环境使用代理，其他情况使用完整域名

// ─── 环境变量统一读取点 ───────────────────────────────────
// 项目内唯一读取 process.env 的文件；其它模块一律 import 这些常量，禁止直接读 process.env。
// 注：process.env.TARO_ENV / NODE_ENV 是 Taro 构建时注入的框架常量（非 .env 配置），不在此列。

// 后端服务器地址（小程序直连，H5 走 /server 代理）
export const SERVER_BASE = process.env.TARO_APP_SERVER_BASE || "https://spinach.cc.cd";
// 教务系统域名（用于 Referer/Origin 请求头；H5 走 /hbut 代理，但请求头仍需完整域名）
export const HBUT_ORIGIN = process.env.TARO_APP_HBUT_ORIGIN || "https://jwxt.hbut.edu.cn";
// 关于页面联系方式
export const CONTACT_EMAIL = process.env.TARO_APP_CONTACT_EMAIL || "super_spinach@qq.com";
export const CONTACT_AVATAR = process.env.TARO_APP_CONTACT_AVATAR || "https://foruda.gitee.com/avatar/1777480666913616794/16193480_damn_2_1777480666.png";
// ISBN 查询 appKey
export const ISBN_KEY = process.env.ISBN_KEY || "";
// 云开发环境（小程序原生云 / H5 HTTP SDK 共用 envId 与访问令牌）
export const CLOUDBASE_ENV_ID = process.env.VITE_CLOUDBASE_ENV_ID || "";
export const CLOUDBASE_ACCESS_KEY = process.env.VITE_CLOUDBASE_ACCESS_KEY || "";
export const WEAPP_CLOUD_ENV = process.env.TARO_WEAPP_CLOUD || "";
// Gitee 仓库访问 token
export const GITEE_TOKEN = process.env.TARO_APP_GITEE || "";
// 二手书交易功能开关（仅 === "true" 时启用）
export const ENABLE_BOOK_TRADE = process.env.TARO_APP_ENABLE_BOOK_TRADE === "true";
// 学校官网域名
export const HBUT_WWW_ORIGIN = process.env.TARO_APP_HBUT_WWW || "https://www.hbut.edu.cn";
// Gitee API 域名（与 GITEE_TOKEN 区分）
export const GITEE_BASE = process.env.TARO_APP_GITEE_BASE || "https://gitee.com/";
// 第三方服务域名
export const IPAPI_BASE = process.env.TARO_APP_IPAPI_BASE || "https://ipapi.co/";
export const BIGDATA_BASE = process.env.TARO_APP_BIGDATA_BASE || "https://api.bigdatacloud.net";
export const OPEN_METEO_BASE = process.env.TARO_APP_OPEN_METEO_BASE || "https://api.open-meteo.com/";
// 超星验证码服务域名
export const CAPTCHA_BASE = process.env.TARO_APP_CAPTCHA_BASE || "https://captcha.chaoxing.com/captcha";
// ISBN 查询服务域名（与 ISBN_KEY appKey 配合）
export const ISBN_BASE = process.env.TARO_APP_ISBN_BASE || "https://data.isbn.work";

export const API_BASE = {
	hbut:  isH5 ? "/hbut" : HBUT_ORIGIN,
	hbut_www: isH5 ? "/hbut_www" : HBUT_WWW_ORIGIN,
	gitee:  isH5 ? "/gitee/" : GITEE_BASE,
	ipapi :  isH5 ? "/ipapi" : IPAPI_BASE,
	bigdata:  isH5 ? "/bigdata" : BIGDATA_BASE,
	open_meteo:  isH5 ? "/open_meteo" : OPEN_METEO_BASE,
    server: isH5 ? "server" : SERVER_BASE,
	captcha: isH5 ? "/captcha" : CAPTCHA_BASE,
	isbn: isH5 ? "/isbn" : ISBN_BASE,
};

/** 大学忘记密码页面映射 — key 为大学名称，value 为教务系统登录页 */
export const UNIVERSITY_FORGOT_PASSWORD_URL = {
	"湖北工业大学": `${HBUT_ORIGIN}/admin/login`,
};
