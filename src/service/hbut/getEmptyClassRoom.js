// 获取空教室 — 使用 fetch 绕过 taro-axios-adapter 响应体丢失问题
import { extractEmpytClassRoom } from "../../utils/hbut/emptyClassRoom";

export async function getEmptyRoom(Building, weekNum, week, sectionStr) {
  const params = new URLSearchParams({
    "page.size": "100",
    jxldm: Building,
    zcStr: String(weekNum),
    xqStr: String(week),
    jcStr: sectionStr,
  });
  const url = `/hbut/admin/system/jxzy/jsxx/getKxjscx?${params.toString()}`;

  try {
    const resp = await fetch(url, {
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

    const rooms = extractEmpytClassRoom(results);
    if (rooms.length > 0) {
      console.log("[getEmptyRoom] 第一条数据:", JSON.stringify(rooms[0]));
    }
    return rooms;
  } catch (error) {
    if (error instanceof Error) throw error;
    console.warn("获取空教室失败：" + error);
    throw error;
  }
}
