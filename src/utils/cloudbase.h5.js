import Taro from "@tarojs/taro";

/**
 * H5 云函数调用接口
 * 使用 @cloudbase/js-sdk HTTP API（需设 VITE_CLOUDBASE_ACCESS_KEY）
 */
export const cloudbase = {
  async callFunction({ name, data }) {
    return callViaHttp(name, data);
  },
};

// ─── HTTP API ─────────────────────────────────────────
let h5Client = null;

async function getH5Client() {
  if (h5Client) return h5Client;
  const envId = process.env.VITE_CLOUDBASE_ENV_ID;
  const accessKey = process.env.VITE_CLOUDBASE_ACCESS_KEY;
  if (!accessKey) {
    throw new Error("VITE_CLOUDBASE_ACCESS_KEY 未配置，无法初始化云开发 SDK");
  }
  const sdk = await import("@cloudbase/js-sdk");
  h5Client = sdk.default.init({
    env: envId,
    accessKey,
  });
  console.log("[Cloudbase] H5 SDK 初始化成功, env:", envId);
  return h5Client;
}

async function callViaHttp(name, data) {
  const client = await getH5Client();
  return client.callFunction({ name, data });
}
