import { hbutRequest } from "../../utils/request";

export async function getAllWeek() {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		// dataType: "text",
		withCredentials: true,
	};
	const response = await hbutRequest.get(
		"/admin/getCurrentPkZc",
		loginConfig,
	);
	if(response.data.ret === 0){
		console.log("获取排课周次成功")
		return response.data.data;
	}
	else{
		console.log("获取排课周次失败");
		return [0];
	}
}
