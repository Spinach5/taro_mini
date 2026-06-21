// auth.js —— 客户端教务登录（每次先解滑块验证码 → 再登录）
import Taro from "@tarojs/taro";
import CryptoJS from "crypto-js";
import { hbutRequest } from "../../utils/request";
import { API_BASE } from "../../config/api";
import encryptPassword from "../../utils/hbut/loginEncrypt";
import userManager from "../userInfo";
import { cloudbase } from "../../utils/cloudbase";
import runtimeLogger from "../../utils/runtimeLogger";

const CAPTCHA_ID = "fdHguSojgSJag5B74ij8Bu8ZAzWlNgXM";
const CAPTCHA = API_BASE.captcha;
const REFERER = "https://jwxt.hbut.edu.cn";
const REFERER_LOGIN = REFERER + "/admin/login";
const IS_H5 = process.env.TARO_ENV === "h5";

const md5 = (s) => CryptoJS.MD5(s).toString();
function uuid4(){
    var arr = [];
        var key = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
          arr[i] = key.substring(Math.floor(Math.random() * 16), 1);
        }
        arr[14] = "4";
        arr[19] = key.substring(arr[19] & 3 | 8, 1);
        arr[8] = arr[13] = arr[18] = arr[23] = "-";
        return arr.join("");
}

// 解析 JSONP：cx_captcha_function({"a":1}) → {"a":1}
function parseJSONP(text) {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("JSONP 响应中未找到 JSON 对象");
  let depth = 0, end = -1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error("JSONP 响应中 JSON 对象未闭合");
  return JSON.parse(text.slice(start, end + 1));
}

// ─── 求解滑块验证码 ──────────────────────────────────────
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
      const confData = parseJSONP(confText);
      console.log("[Captcha] conf 响应:", JSON.stringify(confData));
      const t = confData.t;

      // 2. 生成加密参数
      const captchaKey = md5(String(t) + uuid4());
      const token = md5(String(t) + CAPTCHA_ID + "slide" + captchaKey) + ":" + String(Number(t) + 300000);
      const iv = md5(CAPTCHA_ID + "slide" + String(Date.now()) + uuid4());

      // 3. POST 获取滑块图片 —— 关键：POST 请求 + jcaptchaDefect=1
      const imgForm = new URLSearchParams({
        callback: "cx_captcha_function",
        captchaId: CAPTCHA_ID,
        type: "slide",
        version: "1.1.20",
        captchaKey,
        token,
        referer: REFERER_LOGIN,
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
          data: imgForm.toString(),
        });
        imgText = imgRes.data;
      }
      const imgData = parseJSONP(imgText);
      console.log("[Captcha] 图片响应 keys:", Object.keys(imgData).join(", "));
      const vo = imgData && imgData.imageVerificationVo;
      if (!vo || !vo.shadeImage || !vo.cutoutImage) {
        console.warn("[Captcha] 未获取到滑块图片, full response:", imgText);
        continue;
      }
      // 图片接口返回的新 token，用于后续验证
      const verifyToken = imgData.token;
      console.log("[Captcha] verifyToken:", verifyToken, "| dataToken:", imgData.data?.token, "| result:", imgData.result);
      if (!verifyToken) { console.warn("[Captcha] 未获取到 verifyToken, full response:", imgText); continue; }

      // 4. 云函数计算缺口距离
      const cloudRes = await cloudbase.callFunction({ name: "captcha", data: { shadeImage: vo.shadeImage, cutoutImage: vo.cutoutImage } });
      const x = (cloudRes.result && cloudRes.result.x) || 0;
      console.log(`[Captcha] gap: ${x}px`);
      if (x < 10) continue;

      // 5. 提交验证结果
      const checkDataReq = {
        callback: "cx_captcha_function", captchaId: CAPTCHA_ID, type: "slide",
        token: verifyToken, textClickArr: `[{"x":${x}}]`, coordinate: "[]",
        runEnv: "10", version: "1.1.20", t: "a", iv, _: String(Date.now()),
      };
      let checkText;
      const checkRes = await Taro.request({
        url: `${CAPTCHA}/check/verification/result`,
        method: "GET", dataType: "text",
        data: checkDataReq,
        header: { Host: "captcha.chaoxing.com",Referer: REFERER + "/" },
      });
      checkText = checkRes.data;
      const checkData = parseJSONP(checkText);
      console.log("[Captcha] 验证响应:", JSON.stringify(checkData));

      // 验证成功：error:0 且 (result:true 或 code:0/200)
      // 注意：error:0 + result:false = 滑块距离不对，需重试
      if (checkData.error !== 0) { console.warn("[Captcha] error != 0, 重试"); continue; }
      if (checkData.result !== true && checkData.code !== 0 && checkData.code !== 200) {
        console.warn("[Captcha] result=false, code=" + checkData.code + ", 缺口:" + x + "px, 重试");
        continue;
      }

      // 提取 validate（从 checkData.extraData JSON 字符串中解析）
      let validate = "";
      try {
        if (checkData.extraData && typeof checkData.extraData === "string") {
          const ed = JSON.parse(checkData.extraData);
          if (ed.validate) validate = ed.validate;
        }
      } catch (_) {
        // extraData 解析失败，回退到原始文本正则匹配
        const match = checkText.match(/"validate":"([^"]+)"/);
        if (match) validate = match[1];
        // 去掉可能的转义反斜杠
        validate = validate.replace(/\\/g, "");
      }
      console.log(`[Captcha] solved, validate: ${validate || "(无)"}`);
      return { success: true, validate };
    } catch (e) {
      console.error(`[Captcha] attempt ${i} failed:`, e.message || e);
    }
  }
  return { success: false };
}

// ─── 登录 ────────────────────────────────────────────────
// 每次登录都先解滑块，再提交（保险起见）
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

  // 先解滑块
  const captchaResult = await solveCaptchaClient();
  if (!captchaResult.success) {
    return { success: false, message: "验证码求解失败，请手动登录教务系统" };
  }
  const validate = captchaResult.validate;

  // 构建登录参数
  const params = new URLSearchParams();
  params.append("username", stuId);
  params.append("password", encodedPassword);
  params.append("vcode", "");
  if (validate) params.append("jcaptchaCode", validate);
  params.append("rememberMe", "1");

  const loginConfig = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Referer: REFERER,
      Origin: REFERER,
    },
    withCredentials: true,
  };

  try {
    const response = await hbutRequest.post("/admin/login", params, loginConfig);
    const httpStatus = response.status;

    // weapp: POST 返回 302 → 登录成功（Cookie 已由 requestCore 保存）
    if (!IS_H5 && httpStatus >= 300 && httpStatus < 400) {
      return { success: true, message: "登录成功" };
    }

    // JSON 响应处理
    const responseData = response.data;
    if (typeof responseData === "object" || (typeof responseData === "string" && (responseData.startsWith("{") || responseData.startsWith("[")))) {
      try {
        const jsonData = typeof responseData === "object" ? responseData : JSON.parse(responseData);

        // ret ≠ "0" → 登录失败（密码错误）
        if (jsonData.ret !== undefined && String(jsonData.ret) !== "0") {
          return { success: false, message: "密码输入错误" };
        }

        const codeVal = jsonData.code !== undefined ? jsonData.code : jsonData.ret;
        if (codeVal !== undefined && codeVal !== 0 && codeVal !== 200 && String(codeVal) !== "0") {
          return { success: false, message: jsonData.message || jsonData.msg || "登录失败" };
        }
      } catch (_) {}
    }

    if (httpStatus !== 200 && !(httpStatus >= 300 && httpStatus < 400)) {
      return { success: false, message: `HTTP 错误: ${httpStatus}` };
    }

    return { success: true, message: "登录成功" };
  } catch (error) {
    runtimeLogger.error("Auth", "登录请求失败", error);
    if (error.response) {
      const d = error.response.data;
      if (typeof d === "object") return { success: false, message: d.message || d.msg || "请求失败" };
    }
    return { success: false, message: error.message || "网络请求失败" };
  }
}
