// auth.js —— 客户端教务登录（检测验证码 → 云函数求解 → 提交 → 重新登录）
import Taro from "@tarojs/taro";
import CryptoJS from "crypto-js";
import { hbutRequest } from "../../utils/request";
import { API_BASE } from "../../config/api";
import encryptPassword from "../../utils/hbut/loginEncrypt";
import userManager from "../userInfo";
import runtimeLogger from "../../utils/runtimeLogger";
import { cloudbase } from "../../utils/cloudbase";

const CAPTCHA_ID = "fdHguSojgSJag5B74ij8Bu8ZAzWlNgXM";
const CAPTCHA = API_BASE.captcha;
const REFERER = "https://jwxt.hbut.edu.cn";
const IS_H5 = process.env.TARO_ENV === "h5";

const md5 = (s) => CryptoJS.MD5(s).toString();
const uuid4 = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
  const r = (Math.random() * 16) | 0;
  return (c === "x" ? r : (r & 3) | 8).toString(16);
});

// 解析 JSONP 响应：cx_captcha_function({...}) → { ... }
function parseJSONP(text) {
  return JSON.parse(text.slice(text.indexOf("(") + 1, text.lastIndexOf(")")));
}

// ─── 客户端求解滑块（本地会话，通过代理调超星 API） ───────
// 返回 { success: boolean, validate?: string }
async function solveCaptchaClient() {
  for (let i = 0; i < 3; i++) {
    try {
      // 1. 获取 captcha 配置 → 拿到服务端时间戳 t
      const now = Date.now();
      const confUrl = `${CAPTCHA}/get/conf?callback=cx_captcha_function&captchaId=${CAPTCHA_ID}&_=${now}`;
      const confText = IS_H5
        ? await fetch(confUrl, { credentials: "include" }).then(r => r.text())
        : (await Taro.request({ url: confUrl, method: "GET", dataType: "text" })).data;
      const t = parseJSONP(confText).t;

      // 2. 生成加密参数
      const captchaKey = md5(String(t) + uuid4());
      const token = md5(String(t) + CAPTCHA_ID + "slide" + captchaKey) + ":" + String(Number(t) + 0x493e0);
      const iv = md5(CAPTCHA_ID + "slide" + String(Date.now()) + uuid4());

      // 3. POST 获取滑块图片 —— 关键：POST 请求 + jcaptchaDefect=1
      const imgForm = new URLSearchParams({
        callback: "cx_captcha_function",
        captchaId: CAPTCHA_ID,
        type: "slide",
        version: "1.1.20",
        captchaKey,
        token,
        referer: REFERER + "/admin/login",
        jcaptchaDefect: "1",
        iv,
        _: String(Date.now()),
      });
      let imgText;
      if (IS_H5) {
        imgText = await fetch(`${CAPTCHA}/get/verification/image`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
          body: imgForm.toString(),
        }).then(r => r.text());
      } else {
        const imgRes = await Taro.request({
          url: `${CAPTCHA}/get/verification/image`,
          method: "POST",
          dataType: "text",
          header: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
          data: Object.fromEntries(imgForm),
        });
        imgText = imgRes.data;
      }
      const imgData = parseJSONP(imgText);
      const { shadeImage, cutoutImage } = imgData.imageVerificationVo;
      // 图片接口返回的新 token，用于后续验证（非请求时生成的 token）
      const verifyToken = imgData.token;
      if (!verifyToken) { console.warn("[Captcha] 未获取到 verifyToken"); continue; }

      // 4. 云函数计算缺口距离
      const cloudRes = await cloudbase.callFunction({ name: "captcha", data: { shadeImage, cutoutImage } });
      const x = (cloudRes.result && cloudRes.result.x) || 0;
      console.log(`[Captcha] gap: ${x}px`);
      if (x < 10) continue;

      // 5. 提交验证结果 → 拿到 validate
      const checkParams = {
        callback: "cx_captcha_function", captchaId: CAPTCHA_ID, type: "slide",
        token: verifyToken, textClickArr: `[{"x":${x}}]`, coordinate: "[]", runEnv: "10",
        version: "1.1.20", t: "a", iv, _: String(Date.now()),
      };
      let checkText;
      if (IS_H5) {
        checkText = await fetch(`${CAPTCHA}/check/verification/result?${new URLSearchParams(checkParams)}`, { credentials: "include" }).then(r => r.text());
      } else {
        const checkRes = await Taro.request({ url: `${CAPTCHA}/check/verification/result`, method: "GET", dataType: "text", data: checkParams });
        checkText = checkRes.data;
      }
      const checkData = parseJSONP(checkText);

      // 判断验证成功：error:0 即通过（result:true / code:0/200 也视为成功）
      const success = checkData.error === 0 || checkData.result === true || checkData.code === 0 || checkData.code === 200;
      if (!success) continue;

      // 提取 extraData.validate（JSONP 返回时不保证都有，无则留空）
      let validate = "";
      const match = checkText.match(/"validate":"([^"]+)"/);
      if (match) validate = match[1];
      console.log(`[Captcha] solved, validate: ${validate || "(无)"}`);
      return { success: true, validate };
    } catch (e) {
      console.error(`[Captcha] attempt ${i} failed:`, e.message || e);
    }
  }
  return { success: false };
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

  const doLogin = async (captchaSolved = false, validate = "") => {
    const params = new URLSearchParams();
    params.append("username", stuId);
    params.append("password", encodedPassword);
    params.append("vcode", "");
    if (validate) params.append("jcaptchaCode", validate);
    params.append("rememberMe", "1");

    const loginConfig = {
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", Referer: REFERER, Origin: REFERER },
      dataType: "text",
      withCredentials: true,
    };

    try {
      const response = await hbutRequest.post("/admin/login", params, loginConfig);
      const responseData = response.data;

      // JSON 响应处理
      if (typeof responseData === "object" || (typeof responseData === "string" && (responseData.startsWith("{") || responseData.startsWith("[")))) {
        try {
          const jsonData = typeof responseData === "object" ? responseData : JSON.parse(responseData);

          // 登录失败（ret ≠ "0"）
          if (jsonData.ret !== undefined && String(jsonData.ret) !== "0") {
            // 尚未解过验证码 → 尝试滑块求解
            if (!captchaSolved) {
              console.log("[Auth] JSON响应检测到验证码(ret=" + jsonData.ret + ")，自动求解...");
              const result = await solveCaptchaClient();
              if (result.success) return doLogin(true, result.validate || "");
              return { success: false, message: "验证码求解失败，请手动登录教务系统" };
            }
            // 已经解过验证码仍失败 → 密码错误
            return { success: false, message: "密码输入错误" };
          }

          // 兼容 code 和 ret 两种成功标识
          const codeVal = jsonData.code !== undefined ? jsonData.code : jsonData.ret;
          if (codeVal !== undefined && codeVal !== 0 && codeVal !== 200 && String(codeVal) !== "0") {
            return { success: false, message: jsonData.message || jsonData.msg || "登录失败" };
          }
        } catch (_) {}
      }

      // 检测验证码（HTML 响应）
      const bodyStr = typeof responseData === "string" ? responseData : "";
      if (!captchaSolved && /captcha|jcaptchaCode|jcaptchaDefect|chaoxing\.com\/load\.min\.js/i.test(bodyStr)) {
        console.log("[Auth] 检测到验证码，自动求解...");
        const result = await solveCaptchaClient();
        if (result.success) return doLogin(true, result.validate || "");
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
