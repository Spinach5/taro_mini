import cloudbaseSDK from "@cloudbase/js-sdk";

export const cloudbase = cloudbaseSDK.init({
  env: process.env.VITE_CLOUDBASE_ENV_ID,
  region: process.env.VITE_CLOUDBASE_REGION,
  accessKey: process.env.VITE_CLOUDBASE_ACCESS_KEY
});
