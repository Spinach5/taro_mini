// 获取空教室
import { hbutRequest } from "../../utils/request";
import { extractEmpytClassRoom } from "../../utils/hbut/emptyClassRoom";

const IS_H5 = process.env.TARO_ENV === "h5";

export async function getEmptyRoom(Building, weekNum, week, sectionStr) {
  const params = new URLSearchParams({
    "page.size": "100",
    jxldm: Building,
    zcStr: String(weekNum),
    xqStr: String(week),
    jcStr: sectionStr,
  });
  const query = params.toString();

  try {
    if (IS_H5) {
      // H5 用 fetch 绕过 taro-axios-adapter 响应体丢失问题
      const resp = await fetch(`/hbut/admin/system/jxzy/jsxx/getKxjscx?${query}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: "https://jwxt.hbut.edu.cn",
          Origin: "https://jwxt.hbut.edu.cn",
        },
      });
      const json = await resp.json();

      if (json.ret !== 0) {
        console.warn("[getEmptyRoom] 接口返回异常:", json);
        throw new Error(`空教室查询失败 (ret=${json.ret}): ${json.msg || ""}`);
      }

      const results = json.results;
      if (!results || !Array.isArray(results) || results.length === 0) {
        return [];
      }

      return extractEmpytClassRoom(results);
    } else {
      // 微信小程序用 hbutRequest（Taro.request 正常工作）
      const response = await hbutRequest.get(
        `/admin/system/jxzy/jsxx/getKxjscx?${query}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Referer: "https://jwxt.hbut.edu.cn",
            Origin: "https://jwxt.hbut.edu.cn",
          },
          withCredentials: true,
        },
      );

      const json = response.data;
      if (json.ret !== 0) {
        console.warn("[getEmptyRoom] 接口返回异常:", json);
        throw new Error(`空教室查询失败 (ret=${json.ret}): ${json.msg || ""}`);
      }

      const results = json.results;
      if (!results || !Array.isArray(results) || results.length === 0) {
        return [];
      }

      return extractEmpytClassRoom(results);
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    console.warn("获取空教室失败：" + error);
    throw error;
  }
}
