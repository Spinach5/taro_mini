//学生成绩绩点
//
//https://hbut.jw.chaoxing.com/admin/xsd/xskp/xyqk?fasz=1&xhid=WGEyQ0A060BFCE117962FE2951D721C2842918F0B14353B7A53993E75A94C62D1C8EE9C200B73B46567C78
import { hbutRequest } from "../../utils/request";

export async function getScores() {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		withCredentials: true,
	};

	const response = await hbutRequest.get(
		"/admin/xsd/xskp/xyqk",
		 loginConfig);
	if(response.data.ret === 0){
		return response.data.data;
	}
	else{
		console.log("获取当前分数失败")
		console.log(response.data);
		return [];

	}
}
