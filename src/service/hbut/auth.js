// auth.js —— 客户端教务登录（检测验证码 → 云函数求解 → 提交 → 重新登录）
import Taro from "@tarojs/taro";
import CryptoJS from "crypto-js";
import { hbutRequest } from "../../utils/request";
import { API_BASE } from "../../config/api";
import encryptPassword from "../../utils/hbut/loginEncrypt";
import userManager from "../userInfo";
import runtimeLogger from "../../utils/runtimeLogger";

const CAPTCHA_ID = "fdHguSojgSJag5B74ij8Bu8ZAzWlNgXM";
const CAPTCHA = API_BASE.captcha;
const REFERER = "https://jwxt.hbut.edu.cn";

const md5 = (s) => CryptoJS.MD5(s).toString();
const uuid4 = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
  const r = (Math.random() * 16) | 0;
  return (c === "x" ? r : (r & 3) | 8).toString(16);
});

// ─── 客户端求解滑块（本地会话，通过代理调超星 API） ───────
async function solveCaptchaClient() {
  for (let i = 0; i < 3; i++) {
    try {
      // 1. 获取 captcha 配置
      const now = Date.now();
      const confUrl = `${CAPTCHA}/get/conf?callback=cx_captcha_function&captchaId=${CAPTCHA_ID}&_=${now}`;
      const confRes = await Taro.request({ url: confUrl, method: "GET", dataType: "text" });
      const confText = confRes.data;
      const t = JSON.parse(confText.slice(confText.indexOf("(") + 1, confText.lastIndexOf(")"))).t;

      // 2. 生成参数
      const captchaKey = md5(String(t) + uuid4());
      const token = md5(String(t) + CAPTCHA_ID + "slide" + captchaKey) + ":" + String(Number(t) + 0x493e0);
      const iv = md5(CAPTCHA_ID + "slide" + String(Date.now()) + uuid4());

      // 3. 获取图片 URL
      const imgUrl = `${CAPTCHA}/get/verification/image`;
      const imgRes = await Taro.request({
        url: imgUrl, method: "GET", dataType: "text",
        data: { callback: "cx_captcha_function", captchaId: CAPTCHA_ID, type: "slide", version: "1.1.20", captchaKey, token, referer: REFERER, iv, _: String(Date.now()) },
      });
      const imgText = imgRes.data;
      const imgData = JSON.parse(imgText.slice(imgText.indexOf("(") + 1, imgText.lastIndexOf(")")));
      const { shadeImage, cutoutImage } = imgData.imageVerificationVo;

      // 4. 云函数计算缺口距离
      const cloudRes = await Taro.cloud.callFunction({ name: "captcha", data: { shadeImage, cutoutImage } });
      const x = (cloudRes.result && cloudRes.result.x) || 0;
      console.log(`[Captcha] gap: ${x}px`);
      if (x < 10) continue;

      // 5. 提交验证结果
      const checkUrl = `${CAPTCHA}/check/verification/result`;
      const checkRes = await Taro.request({
        url: checkUrl, method: "GET", dataType: "text",
        data: { callback: "cx_captcha_function", captchaId: CAPTCHA_ID, type: "slide", token, textClickArr: `[{"x":${x}}]`, coordinate: "[]", runEnv: "10", version: "1.1.20", t: "a", iv, _: String(Date.now()) },
      });
      const checkText = checkRes.data;
      const checkData = JSON.parse(checkText.slice(checkText.indexOf("(") + 1, checkText.lastIndexOf(")")));
      if (checkData.code === 0 || checkData.code === 200) return true;
    } catch (e) {
      console.error(`[Captcha] attempt ${i} failed:`, e.message || e);
    }
  }
  return false;
}

// ─── 登录 ────────────────────────────────────────────────
export async function auth() {
  const { stuId, password } = userManager.getAccount();

  let encodedPassword = userManager.getEncryptedPassword();
  if (!encodedPassword) {
    try {
      encodedPassword = encryptPassword(password);
      if (!encodedPassword) return { success: false, message: "密码加密失败" };
      userManager.setEncryptedPassword(encodedPassword);
    } catch (e) {
      return { success: false, message: `加密异常: ${e.message}` };
    }
  }

  const doLogin = async (captchaHandled = false) => {
    const params = new URLSearchParams();
    params.append("username", stuId);
    params.append("password", encodedPassword);
    params.append("rememberMe", "1");

    const loginConfig = {
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", Referer: REFERER, Origin: REFERER },
      dataType: "text",
      withCredentials: true,
    };

    try {
      const response = await hbutRequest.post("/admin/login", params, loginConfig);
      const responseData = response.data;

      // JSON = 失败
      if (typeof responseData === "object" || (typeof responseData === "string" && (responseData.startsWith("{") || responseData.startsWith("[")))) {
        try {
          const jsonData = typeof responseData === "object" ? responseData : JSON.parse(responseData);
          if (jsonData.code !== 0 && jsonData.code !== 200) {
            return { success: false, message: jsonData.message || jsonData.msg || "登录失败" };
          }
        } catch (_) {}
      }

      // 检测验证码
      const bodyStr = typeof responseData === "string" ? responseData : "";
      if (!captchaHandled && /captcha|jcaptchaCode|chaoxing\.com\/load\.min\.js/i.test(bodyStr)) {
        console.log("[Auth] 检测到验证码，自动求解...");
        const solved = await solveCaptchaClient();
        if (solved) return doLogin(true);
        return { success: false, message: "验证码求解失败，请手动登录教务系统" };
      }

      if (response.statusCode && response.statusCode !== 200) {
        return { success: false, message: `HTTP 错误: ${response.statusCode}` };
      }

      return { success: true, message: "登录成功" };
    } catch (error) {
      if (error.response) {
        const d = error.response.data;
        if (typeof d === "object") return { success: false, message: d.message || d.msg || "请求失败" };
      }
      return { success: false, message: error.message || "网络请求失败" };
    }
  };

  return doLogin();
}
