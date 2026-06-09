// 云函数：serverProxy
// 转发前端请求到 https://8.148.69.248/api/v1
const https = require("https");
const http = require("http");
const url = require("url");

const TARGET = "https://8.148.69.248/api/v1";

exports.main = async (event, context) => {
	const { url: targetUrl, method = "GET", data = null, headers = {} } = event;

	const parsed = new url.URL(targetUrl || TARGET);
	const isHttps = parsed.protocol === "https:";

	const options = {
		hostname: parsed.hostname,
		port: parsed.port || (isHttps ? 443 : 80),
		path: parsed.pathname + parsed.search,
		method: method.toUpperCase(),
		headers: {
			"Content-Type": "application/json",
			...headers,
		},
		rejectUnauthorized: false, // 允许自签名证书
	};

	const transport = isHttps ? https : http;

	return new Promise((resolve, reject) => {
		const req = transport.request(options, (res) => {
			let body = "";
			res.on("data", (chunk) => (body += chunk));
			res.on("end", () => {
				try {
					const parsed = JSON.parse(body);
					resolve({ status: res.statusCode, data: parsed, headers: res.headers });
				} catch {
					resolve({ status: res.statusCode, data: body, headers: res.headers });
				}
			});
		});

		req.on("error", (err) => {
			resolve({ status: 500, data: { success: false, message: err.message } });
		});

		if (data) {
			req.write(typeof data === "string" ? data : JSON.stringify(data));
		}
		req.end();
	});
};
