const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const tough = require('tough-cookie');
const cheerio = require('cheerio');
const fs = require('fs');
const cryptoJs = require('crypto-js'); // xxt.js 的依赖
const { encryptByAES } = require('./xxt.js');

// ==================== 常量 ====================
const baseDomain = 'https://hbut.jw.chaoxing.com';
const XLGL_BASE_URL = baseDomain + '/v2';
const NOTEYD_BASE_URL = 'https://noteyd.chaoxing.com';

// 创建带 Cookie Jar 的全局会话实例
const cookieJar = new tough.CookieJar();
const session = wrapper(axios.create({
  jar: cookieJar,
  withCredentials: true,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
}));

// ==================== 业务函数 ====================

/** 提取 xhid */
async function extractXhid() {
  const res = await session.get(baseDomain + '/admin/pkgl/xskb/queryKbForXsd', {
    responseType: 'text',
  });
  const $ = cheerio.load(res.data);
  return $('#xhid').val() || null;
}

/** 当前学年学期 */
async function getCurrentSemester() {
  const res = await session.post(XLGL_BASE_URL + '/system/jcsj/xnxq/getCurrentXnxq?crossOrigin=true', null, {
    headers: { Referer: 'https://i.chaoxing.com', Accept: 'application/json, text/plain, */*' },
  });
  if (res.data.code === 1) {
    const [year, , semester] = res.data.data.xnxq.split('-');
    return { year: parseInt(year), semester: parseInt(semester) };
  }
  return null;
}

/** 用户信息 */
async function getUserInfo() {
  const res = await session.post(XLGL_BASE_URL + '/xjgl/xsjbxx/getXsjbxxByUser', null, {
    headers: { Referer: 'https://i.chaoxing.com' },
  });
  return res.data.code === 1 ? res.data.data : null;
}

/** 专业排名 */
async function getUserRank() {
  const res = await session.post(XLGL_BASE_URL + '/xsd/index/getXsZypm', null, {
    headers: { Referer: 'https://i.chaoxing.com' },
  });
  return res.data.code === 1 ? res.data.data : null;
}

/** 所在单位 */
async function getUserUnit() {
  const res = await session.post(NOTEYD_BASE_URL + '/proxy/apis/proxy/proxyApiReq?uuid=uidbelongfids&crossOrigin=true&proxy_url=%2Fapi%2Fv2%2Fuidbelongfids', null, {
    headers: { Referer: 'https://i.chaoxing.com' },
  });
  return res.data.result === 1 ? res.data.data : null;
}

/** 平均学分绩点 */
async function getAverageScore() {
  const res = await session.post(XLGL_BASE_URL + '/xsd/index/getXsPjxfjd', null, {
    headers: { Referer: 'https://i.chaoxing.com' },
  });
  return res.data.code === 1 ? res.data.data : null;
}

/** 考试信息 */
async function getExamInfo() {
  const res = await session.post(XLGL_BASE_URL + '/xsd/index/listXsdXsksap', null, {
    headers: { Referer: 'https://i.chaoxing.com' },
  });
  return res.data.code === 1 ? res.data.data : null;
}

/** 已修学分 */
async function getScoreGotten() {
  const res = await session.post(XLGL_BASE_URL + '/xsd/index/getXsXfAndZxf', null, {
    headers: { Referer: 'https://i.chaoxing.com' },
  });
  return res.data.code === 1 ? res.data.data : null;
}

/** 学业完成度 */
async function getStudentAcademic() {
  const res = await session.post(XLGL_BASE_URL + '/xsd/index/getStudentAcademicCompletionRate', null, {
    headers: { Referer: 'https://i.chaoxing.com' },
  });
  return res.data.code === 1 ? res.data.data : null;
}

/** 学期列表 */
async function getSemesterList() {
  const res = await session.post(XLGL_BASE_URL + '/system/jcsj/xnxq/getXnxqList?crossOrigin=true', null, {
    headers: { Referer: 'https://i.chaoxing.com' },
  });
  return res.data.code === 1 ? res.data.data : null;
}

/** 成绩列表 */
async function getScoreList() {
  const res = await session.post(XLGL_BASE_URL + '/xsd/index/listXsdXscj', null, {
    headers: { Referer: 'https://i.chaoxing.com' },
  });
  return res.data.code === 1 ? res.data.data : null;
}

/** 不及格门数及学分 */
async function getNotpassList() {
  const res = await session.post(XLGL_BASE_URL + '/xsd/index/getXsBjgmsAndXf', null, {
    headers: { Referer: 'https://i.chaoxing.com' },
  });
  return res.data.code === 1 ? res.data.data : null;
}

/** 当前周次 */
async function getCurrentWeek() {
  const res = await session.get('https://hbut.jw.chaoxing.com/admin/api/getXlzc');
  if (res.data.ret === 0) {
    console.log('当前周次:', res.data.data.xlzc);
    return res.data.data.xlzc;
  }
  return null;
}

/** 提取实践环节等附加信息 */
async function extractOther(year, semester) {
  const url = `https://hbut.jw.chaoxing.com/admin/pkgl/xskb/queryKbForXsd?xnxq=${year}-${year + 1}-${semester}`;
  const res = await session.get(url, { responseType: 'text' });
  fs.writeFileSync('user.html', res.data, 'utf-8');
  const $ = cheerio.load(res.data);
  const td = $('td[colspan="8"]');
  if (!td.length) return [];
  let fullText = td.text().replace(/\s+/g, '');
  const items = [];
  const parts = fullText.split('实践环节：');
  for (let i = 1; i < parts.length; i++) {
    const endIdx = parts[i].indexOf('人；');
    if (endIdx !== -1) {
      items.push(parts[i].substring(0, endIdx + 2));
    }
  }
  return items;
}

/** 获取课表 */
async function getClassSchedule(year, semester, xhid) {
  const url = `https://hbut.jw.chaoxing.com/admin/pkgl/xskb/sdpkkbList?xnxq=${year}-${year + 1}-${semester}&xhid=${xhid}`;
  const res = await session.get(url, {
    headers: { Referer: url, Accept: 'application/json, text/plain, */*' },
  });
  return res.data.ret === 0 ? res.data : null;
}

/** 登录并获取 mitudz 域 Cookies */
async function getMitudzCookies(username, password, isProxy = false, proxyPort = 7890) {
  // 1. 获取动态 AES 密钥
  let aeskey = 'u2oh6Vu^HWe4_AES';
  try {
    const rawRes = await axios.get('https://passport2-static.chaoxing.com/js/fanya/login.js', {
      headers: { Referer: 'https://i.chaoxing.com' },
    });
    const match = rawRes.data.match(/var transferKey\s*=\s*"([^"]+)"/);
    if (match) aeskey = match[1];
    console.log('AES 密钥:', aeskey);
  } catch (e) {
    console.log('获取远程登录 JS 失败，使用默认密钥');
  }

  // 2. 加密
  const encodedUser = encryptByAES(username, aeskey);
  const encodedPass = encryptByAES(password, aeskey);
  console.log('加密用户名:', encodedUser);

  // 3. 登录请求（使用 session 以保存 Cookie）
  const loginUrl = 'https://passport2.chaoxing.com/fanyalogin';
  const params = new URLSearchParams();
  params.append('uname', encodedUser);
  params.append('password', encodedPass);
  params.append('refer', 'https%3A%2F%2Fi.chaoxing.com');
  params.append('t', 'true');

  const loginConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: 'https://passport2.chaoxing.com/login',
    },
  };

  const loginRes = await session.post(loginUrl, params, loginConfig);
  const data = loginRes.data;
  if (!data.status) {
    console.error('登录失败:', data);
    return null;
  }

  const realUrl = decodeURIComponent(data.url);
  console.log('登录成功，跳转:', realUrl);

  // 4. 同步主域 Cookie 并跳转获取 mitudz
  console.log('[1] 访问 i.chaoxing.com 同步主域 Cookie...');
  await session.get(realUrl, {
    headers: { Referer: 'https://passport2.chaoxing.com/login' },
    maxRedirects: 5,
  });

  console.log('[2] 访问个人空间...');
  await session.get('https://i.chaoxing.com/base', {
    headers: { Referer: 'https://i.chaoxing.com' },
    maxRedirects: 5,
  });

  console.log('[3] SSO 跳转获取 mitudz...');
  const authUrl = 'https://vkb.jw.chaoxing.com/admin/api/xxtlogin?loginUrl=https%3A%2F%2Fhbut.jw.chaoxing.com%2Fadmin%2Flogin2%3Frole%3Dxs%26url%3Dhttps%253A%252F%252Fmitudz.jw.chaoxing.com%252Fviews%252FhomePage.html%253Frole%253D1%2526domainUrl%253Dhbut.jw.chaoxing.com';
  const finalRes = await session.get(authUrl, {
    headers: { Referer: 'https://i.chaoxing.com/base' },
    maxRedirects: 5,
    responseType: 'text',  // 确保得到 HTML 字符串
  });

  console.log('最终 URL:', finalRes.request?.res?.responseUrl || finalRes.config.url);

  // 返回当前 jar 中 mitudz 域的 cookies 字典
  const cookies = await cookieJar.getCookies(baseDomain);
  const cookDict = {};
  cookies.forEach(c => { cookDict[c.key] = c.value; });
  return cookDict;
}

// ==================== 主流程 ====================
// async function main() {
//   const year = 2025, semester = 2;

//   // 登录（请替换真实账号密码）
//   const cookies = await getMitudzCookies('13687106362', 'Spinach114514!');
//   if (!cookies) {
//     console.log('登录失败');
//     return;
//   }

//   const xhid = await extractXhid();
//   console.log('xhid:', xhid);
//   if (!xhid) return;

//   await extractOther(year, semester);
//   await getCurrentWeek();

//   console.log('\n学期列表:', JSON.stringify(await getSemesterList()));
//   console.log('用户信息:', JSON.stringify(await getUserInfo()));
//   console.log('考试信息:', JSON.stringify(await getExamInfo()));
//   console.log('学业完成度:', JSON.stringify(await getStudentAcademic()));
//   console.log('成绩列表:', JSON.stringify(await getScoreList()));
//   console.log('不及格信息:', JSON.stringify(await getNotpassList()));
//   console.log('专业排名:', JSON.stringify(await getUserRank()));
//   console.log('平均绩点:', JSON.stringify(await getAverageScore()));
//   console.log('已修学分:', JSON.stringify(await getScoreGotten()));
//   console.log('所在单位:', JSON.stringify(await getUserUnit()));
// }

// main().catch(console.error);
