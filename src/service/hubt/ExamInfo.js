//获取考试信息
//https://jwxt.hbut.edu.cn/admin/xsd/kwglXsdKscx/ajaxXsksList get 
import { hbutRequest } from "../../utils/request";

export async function getExamInfo() {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		withCredentials: true,
	};

	const response = await hbutRequest.get(
		"/admin/xsd/kwglXsdKscx/ajaxXsksList",
		 loginConfig);
	if(response.data.ret === 0){
		return response.data.results;
	}
	else{
		console.log("获取当前考试信息失败")
		console.log(response.data);
		return [];

	}
}
