// auth.js —— 客户端教务登录（每次先解滑块验证码 → 再登录）
import Taro from "@tarojs/taro";
import CryptoJS from "crypto-js";
import { hbutRequest, hbutCookies } from "../../../utils/platform/request";
import { serverPost } from "../../../utils/platform/serverRequest";
import { API_BASE } from "../../../config/api";
import encryptPassword from "../../../utils/business/hbut/loginEncrypt";
import userManager from "../../userInfo";
import runtimeLogger from "../../../utils/common/runtimeLogger";

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

      // 4. 请求服务器计算缺口距离
      const captchaRes = await serverPost("/api/captcha/solve", { shadeImage: vo.shadeImage, cutoutImage: vo.cutoutImage });
      const x = (captchaRes.success && captchaRes.data && captchaRes.data.x) || 0;
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

// ─── 将 cookie 数组解析为键值对对象 ─────────────────────────
function parseResCookies(cookiesArray) {
  const obj = {};
  if (!cookiesArray || !Array.isArray(cookiesArray)) return obj;
  cookiesArray.forEach(c => {
    if (c.name) obj[c.name] = c.value || "";
  });
  return obj;
}

// ─── 从响应中提取并保存 cookie ───────────────────────────
function saveCookiesFromRes(res, cookieManager) {
  // 方式1：res.cookies（Taro 4.x，包含重定向链所有 cookie）
  const cookieObj = parseResCookies(res.cookies);
  // 方式2：res.header["set-cookie"]
  const setCookieHeader = res.header["set-cookie"] || res.header["Set-Cookie"];
  if (setCookieHeader) {
    const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    headers.forEach(h => cookieManager.parseAndMerge(h));
  }
  // 方式1 再合并一次（确保 res.cookies 的覆盖 header 解析的）
  if (Object.keys(cookieObj).length > 0) {
    cookieManager.setAll(cookieObj);
  }
}

// ─── 登录 ────────────────────────────────────────────────
// 流程：GET 登录页获取初始 cookie → POST 登录（跟随重定向）
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

  const baseHeaders = {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Referer: REFERER,
    Origin: REFERER,
  };

  try {
    // ── 第1步：GET 登录页面，获取初始 cookie（uid、route），模拟浏览器行为 ──
    console.log("[Auth] 第1步：获取登录页面初始 cookie...");
    await hbutRequest.get("/admin/login", {
      headers: baseHeaders,
    });
    console.log("[Auth] 登录页 cookies:", JSON.stringify(hbutCookies.getAll()));

    // ── 第2步：POST 登录 ──
    // H5 通过代理（/hbut → Vite proxy → jwxt.hbut.edu.cn）避免 CORS
    // 微信小程序直接请求（无 CORS 限制）
    console.log("[Auth] 第2步：POST 登录...");
    const cookieStr = hbutCookies.toString();

    const postHeaders = { ...baseHeaders };
    // H5 使用 hbutRequest (axios) 时，其请求拦截器会自动注入 Cookie，
    // 此处不在 postHeaders 中手动添加，避免重复
    if (!IS_H5 && cookieStr) {
      postHeaders["Cookie"] = cookieStr;
    }

    let postRes;
    if (IS_H5) {
      // H5: 通过 proxy 请求，hbutRequest baseURL 为 /hbut
      const axiosRes = await hbutRequest.post("/admin/login", params.toString(), {
        headers: postHeaders,
      });
      // 归一化为 Taro 响应格式，供后续代码使用
      postRes = {
        data: axiosRes.data,
        statusCode: axiosRes.status,
        header: axiosRes.headers,
      };
      // H5 的 axios 响应拦截器已在内部保存 Set-Cookie，无需额外调用 saveCookiesFromRes
    } else {
      // 微信小程序：直接请求教务系统
      const fullUrl = `${REFERER}/admin/login`;
      postRes = await Taro.request({
        url: fullUrl,
        method: "POST",
        data: params.toString(),
        header: postHeaders,
      });
      // 保存重定向链中所有 cookie
      saveCookiesFromRes(postRes, hbutCookies);
    }

    const httpStatus = postRes.statusCode;

    console.log(`[Auth] POST /admin/login → status=${httpStatus}`);
    console.log("[Auth] 登录后 cookies:", JSON.stringify(hbutCookies.getAll()));

    // 检查是否有认证 cookie（puid/username 等登录成功才有的字段）
    // H5：JS 管理的 CookiesManager 始终为空（Set-Cookie 是浏览器禁止头），
    // 改为检查 document.cookie（浏览器自动存储的 cookie）
    let hasAuthCookie = false;
    if (IS_H5) {
      const docCookie = typeof document !== "undefined" ? document.cookie : "";
      hasAuthCookie = docCookie.includes("puid") && docCookie.includes("username");
      console.log("[Auth] H5 document.cookie 包含 puid:", docCookie.includes("puid"), "username:", docCookie.includes("username"));
    } else {
      const allCookies = hbutCookies.getAll();
      hasAuthCookie = allCookies.puid && allCookies.username;
      console.log("[Auth] 是否有认证 cookie:", hasAuthCookie, "keys:", Object.keys(allCookies).join(", "));
    }

    if (hasAuthCookie) {
      return { success: true, message: "登录成功" };
    }

    // 如果回到了登录页面（检查是否包含登录表单，而非简单的页面标题）
    if (typeof postRes.data === "string") {
      const isLoginForm = /<form[^>]*login/i.test(postRes.data)
        || /<input[^>]*type=["']password["']/i.test(postRes.data);
      if (isLoginForm) {
        console.warn("[Auth] 最终页面包含登录表单，登录失败");
        return { success: false, message: "登录失败，账号或密码错误" };
      }
    }

    // 兜底：http 状态码判断
    if (httpStatus >= 200 && httpStatus < 400) {
      return { success: true, message: "登录成功" };
    }

    return { success: false, message: `服务器返回 ${httpStatus}` };
  } catch (error) {
    runtimeLogger.error("Auth", "登录请求失败", error);
    return { success: false, message: error.message || "网络请求失败" };
  }
}
