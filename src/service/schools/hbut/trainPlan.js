import { hbutRequest } from "../../../utils/platform/request";
import withCache from "../../../utils/common/withCache";
import { AutoRetry } from "./autoRetry";
import { extractTrainPlan } from "../../../utils/business/hbut/trainPlanHelper";
import { getXhid } from "./GetXhid";
import userManager from "../../userInfo";
import runtimeLogger from "../../../utils/common/runtimeLogger";

const _cachedTrainPlan = withCache(
  "train_plan",
  30 * 60 * 1000,
  async (grade, kkxq) => {
    const fetchTrainPlan = async (pageSize = 50) => {
      const loginConfig = {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",
          Referer: "https://jwxt.hbut.edu.cn",
          Origin: "https://jwxt.hbut.edu.cn",
        },
        withCredentials: true,
      };

      const xhid = await getXhid();
      const params = new URLSearchParams();

      params.append("page.size", String(pageSize));
      params.append("page.pn", "1");
      params.append("grade", grade);
      params.append("kkxq", kkxq);
      params.append("userId", xhid);

      const response = await hbutRequest.post(
        "admin/xsd/studentpyfa/ajaxList2?gridtype=jqgrid",
        params,
        loginConfig,
      );
      return response;
    };

    try {
      let response = await AutoRetry(fetchTrainPlan, { maxRetry: 1 });

      if (response.status !== 200) {
        console.log("[getTrainPlan] 网络请求失败, status:", response.status);
        console.warn("获取培养计划失败：网络请求失败");
        return [];
      }

      const data = response.data;

      if (!data || data.msg !== "ok" || data.ret !== 0) {
        console.log("[getTrainPlan] 接口返回异常:", data);
        console.warn("获取培养计划失败：接口返回异常");
        return [];
      }

      const { total, results } = data;

      if (!results || !Array.isArray(results)) {
        console.log("[getTrainPlan] 响应数据中无 results 字段");
        console.warn("获取培养计划失败：响应数据中无课程数据");
        return [];
      }

      if (total > results.length) {
        console.log(`[getTrainPlan] 数据未完整获取，总数 ${total}，当前 ${results.length}，重新获取`);
        response = await AutoRetry(() => fetchTrainPlan(total), { maxRetry: 1 });
        if (response.status === 200 && response.data && response.data.msg === "ok" && response.data.ret === 0) {
          return extractTrainPlan(response.data.results || []);
        }
      }

      return extractTrainPlan(results);
    } catch (error) {
      runtimeLogger.error("TrainPlan", "获取培养计划失败", error);
      if (error instanceof Error) {
        throw error;
      }
      console.warn("获取培养计划失败：" + error);
      throw new Error(String(error));
    }
  },
  {
    keyBuilder: ([grade, kkxq]) => `${grade}-${kkxq}` || "default",
  },
);

export async function getTrainPlan(grade, kkxq, forceRefresh = false) {
  if (forceRefresh) {
    _cachedTrainPlan.invalidate([grade, kkxq]);
    console.log(`[getTrainPlan] 已清除${grade}-${kkxq}培养计划缓存`);
  }
  return _cachedTrainPlan(grade, kkxq);
}
