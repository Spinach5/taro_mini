import { defineConfig } from "@tarojs/cli";
import https from "https";
import fs from "fs";
import devConfig from "./dev";
import prodConfig from "./prod";

// 手动加载 .env 文件（Taro 不自动加载），确保 defineConstants 能取到环境变量
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // 去除首尾引号（.env 文件常用双引号包裹值）
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && !process.env[key]) {
      process.env[key] = val;
    }
  }
}
const configDir = new URL(".", import.meta.url).pathname;
const projectDir = configDir.replace(/\/config\/$/, "");
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
loadEnvFile(`${projectDir}/${envFile}`);
loadEnvFile(`${projectDir}/.env`);

export default defineConfig(async (merge, { command, mode }) => {
	const baseConfig = {
		projectName: "zqw",
		date: "2026-4-27",
		designWidth: 750,
		deviceRatio: {
			640: 2.34 / 2,
			750: 1,
			375: 2,
			828: 1.81 / 2,
		},
		sourceRoot: "src",
		outputRoot: `dist/${process.env.TARO_ENV}`,
		plugins: ["@tarojs/plugin-generator"],
		defineConstants: {
			"process.env.TARO_WEAPP_CLOUD": JSON.stringify(
				process.env.TARO_WEAPP_CLOUD || "cloudbase-d0gl91v7x5514ed03",
			),
			"process.env.VITE_CLOUDBASE_ENV_ID": JSON.stringify(
				process.env.VITE_CLOUDBASE_ENV_ID || "cloudbase-d0gl91v7x5514ed03",
			),
			"process.env.VITE_CLOUDBASE_ACCESS_KEY": JSON.stringify(
				process.env.VITE_CLOUDBASE_ACCESS_KEY || "",
			),
		},
		copy: {
			patterns: [],
			options: {},
		},
		framework: "react",
		compiler: {
			type: "vite",
			vitePlugins: [{
				name: "cloudbase-target",
				config: () => ({ build: { target: "es2020" } }),
			}, {
				name: "fix-taro-icons-jsx",
				config: () => ({
					optimizeDeps: {
						esbuildOptions: {
							loader: { ".js": "jsx" },
						},
					},
				}),
				async transform(code, id) {
					if (id.includes("node_modules/taro-icons") && id.endsWith(".js")) {
						const esbuild = await import("esbuild");
						const result = await esbuild.transform(code, { loader: "jsx" });
						return { code: result.code, map: result.map || null };
					}
				},
			}],
		},
		mini: {
			optimizeMainPackage: {
				enable: true,
			},
			postcss: {
				pxtransform: {
					enable: true,
					config: {},
				},
				cssModules: {
					enable: false,
					config: {
						namingPattern: "module",
						generateScopedName: "[name]__[local]___[hash:base64:5]",
				},
			},
		},
	},
	h5: {
			publicPath: "/",
			staticDirectory: "static",
			esnextModules: ["taro-ui", "taro-icons"],
			// 添加代理配置
			devServer: {
				port: 10086,
				proxy: {
					"/gitee": {
						target: "https://gitee.com",
						changeOrigin: true,
						rewrite: (path) => path.replace(/^\/gitee/, ""),
						configure: (proxy, options) => {
							proxy.on("proxyRes", (proxyRes, req, res) => {
								console.log("proxyRes触发");
								if (proxyRes.headers.location) {
									let location = proxyRes.headers.location;
									if (location.startsWith("/")) {
										proxyRes.headers.location =
											"/gitee" + location;
									} else if (location.includes("gitee.com")) {
										const relative = location.replace(
											/https?:\/\/[^/]+/,
											"",
										);
										proxyRes.headers.location =
											"/gitee" + relative;
									}
									console.log(
										"修改后的 location:",
										proxyRes.headers.location,
									);
								}
							});
						},
					},
					"/server": {
						target: "https://8.148.69.248/",
						changeOrigin: true,
						rewrite: (path) => path.replace(/^\/server/, ""),
						configure: (proxy, options) => {
							proxy.on("proxyReq", (proxyReq, req, res) => {
								// 去掉 Origin 避免后端 CORS 403
								proxyReq.removeHeader("origin");
								proxyReq.removeHeader("referer");
							});
							proxy.on("proxyRes", (proxyRes, req, res) => {
								console.log("proxyRes触发");
								if (proxyRes.headers.location) {
									let location = proxyRes.headers.location;
									if (location.startsWith("/")) {
										proxyRes.headers.location =
											"/server" + location;
									} else if (
										location.includes("8.148.69.248")
									) {
										const relative = location.replace(
											/https?:\/\/[^/]+/,
											"",
										);
										proxyRes.headers.location =
											"/server" + relative;
									}
									console.log(
										"修改后的 location:",
										proxyRes.headers.location,
									);
								}
							});
						},
					},
					"/open_meteo": {
						target: "https://api.open-meteo.com/",
						changeOrigin: true,
						rewrite: (path) => path.replace(/^\/open_meteo/, ""),
						configure: (proxy, options) => {
							proxy.on("proxyRes", (proxyRes, req, res) => {
								console.log("proxyRes触发");
								if (proxyRes.headers.location) {
									let location = proxyRes.headers.location;
									if (location.startsWith("/")) {
										proxyRes.headers.location =
											"/open_meteo" + location;
									} else if (
										location.includes("api.open-meteo.com")
									) {
										const relative = location.replace(
											/https?:\/\/[^/]+/,
											"",
										);
										proxyRes.headers.location =
											"/open_meteo" + relative;
									}
									console.log(
										"修改后的 location:",
										proxyRes.headers.location,
									);
								}
							});
						},
					},
					"/hbut_www": {
						target: "https://www.hbut.edu.cn",
						changeOrigin: true,
						secure: false,
						rewrite: (path) => path.replace(/^\/hbut_www/, ""),
						configure: (proxy, options) => {
							proxy.on("proxyRes", (proxyRes, req, res) => {
								console.log("proxyRes触发");
								if (proxyRes.headers.location) {
									let location = proxyRes.headers.location;
									if (location.startsWith("/")) {
										proxyRes.headers.location =
											"/hbut_www" + location;
									} else if (
										location.includes("hbut.edu.cn")
									) {
										const relative = location.replace(
											/https?:\/\/[^/]+/,
											"",
										);
										proxyRes.headers.location =
											"/hbut_www" + relative;
									}
									console.log(
										"修改后的 location:",
										proxyRes.headers.location,
									);
								}
							});
						},
					},
					"/hbut": {
						target: "https://jwxt.hbut.edu.cn",
						changeOrigin: true,
						secure: false,
						agent: new https.Agent({ family: 4, keepAlive: true }),
						rewrite: (path) => path.replace(/^\/hbut/, ""),
						configure: (proxy, options) => {
							proxy.on("proxyRes", (proxyRes, req, res) => {
								console.log("proxyRes触发");
								if (proxyRes.headers.location) {
									let location = proxyRes.headers.location;
									if (location.startsWith("/")) {
										proxyRes.headers.location =
											"/hbut" + location;
									} else if (
										location.includes("jwxt.hbut.edu.cn")
									) {
										const relative = location.replace(
											/https?:\/\/[^/]+/,
											"",
										);
										proxyRes.headers.location =
											"/hbut" + relative;
									}
									console.log(
										"修改后的 location:",
										proxyRes.headers.location,
									);
								}
							});
						},
					},
					"/ipapi": {
						target: "https://ipapi.co",
						changeOrigin: true,
						rewrite: (path) => path.replace(/^\/ipapi/, ""),
						configure: (proxy, options) => {
							proxy.on("proxyRes", (proxyRes, req, res) => {
								console.log("proxyRes触发");
								if (proxyRes.headers.location) {
									let location = proxyRes.headers.location;
									if (location.startsWith("/")) {
										proxyRes.headers.location =
											"/ipapi" + location;
									} else if (location.includes("ipapi.co")) {
										const relative = location.replace(
											/https?:\/\/[^/]+/,
											"",
										);
										proxyRes.headers.location =
											"/ipapi" + relative;
									}
									console.log(
										"修改后的 location:",
										proxyRes.headers.location,
									);
								}
							});
						},
					},
					"/bigdata": {
						target: "https://api.bigdatacloud.net",
						changeOrigin: true,
						agent: new https.Agent({ family: 4 }),
						rewrite: (path) => path.replace(/^\/bigdata/, ""),
						configure: (proxy, options) => {
							proxy.on("proxyRes", (proxyRes, req, res) => {
								console.log("proxyRes触发");
								if (proxyRes.headers.location) {
									let location = proxyRes.headers.location;
									if (location.startsWith("/")) {
										proxyRes.headers.location =
											"/bigdata" + location;
									} else if (location.includes("api.bigdatacloud.net")) {
										const relative = location.replace(
											/https?:\/\/[^/]+/,
											"",
										);
										proxyRes.headers.location =
											"/bigdata" + relative;
									}
									console.log(
										"修改后的 location:",
										proxyRes.headers.location,
									);
								}
							});
						},
					},
					"/captcha": {
					// 超星 captcha API 路径自身包含 /captcha/ 前缀，target 必须带 /captcha
					// 例：/captcha/get/conf → rewrite 去 /captcha → /get/conf → target 拼接
					// → https://captcha.chaoxing.com/captcha/get/conf
					target: "https://captcha.chaoxing.com/captcha",
					changeOrigin: true,
					agent: new https.Agent({ family: 4 }),
					rewrite: (path) => path.replace(/^\/captcha/, ""),
					configure: (proxy, options) => {
						proxy.on("proxyRes", (proxyRes, req, res) => {
							console.log("proxyRes触发");
							if (proxyRes.headers.location) {
								let location = proxyRes.headers.location;
								if (location.startsWith("/")) {
									proxyRes.headers.location =
										"/captcha" + location;
								} else if (location.includes("captcha.chaoxing.com")) {
									const relative = location.replace(
										/https?:\/\/[^/]+/,
										"",
									);
									proxyRes.headers.location =
										"/captcha" + relative;
								}
								console.log(
									"修改后的 location:",
									proxyRes.headers.location,
								);
							}
						});
					},
				},
				},
			},
			miniCssExtractPluginOption: {
				ignoreOrder: true,
				filename: "css/[name].[hash].css",
				chunkFilename: "css/[name].[chunkhash].css",
			},
			postcss: {
				autoprefixer: {
					enable: true,
					config: {},
				},
				cssModules: {
					enable: false,
					config: {
						namingPattern: "module",
						generateScopedName: "[name]__[local]___[hash:base64:5]",
					},
				},
			},
		},
	};

	process.env.BROWSERSLIST_ENV = process.env.NODE_ENV;

	if (process.env.NODE_ENV === "development") {
		return merge({}, baseConfig, devConfig);
	}
	return merge({}, baseConfig, prodConfig);
});
