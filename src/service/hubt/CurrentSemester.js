//现在的学年学期
//https://jwxt.hbut.edu.cn/admin/xsd/xsdcjcx/getCurrentXnxq

import { hbutRequest } from "../../utils/request";

export async function getCurrentSemester() {
	const loginConfig = {
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			Referer: "https://jwxt.hbut.edu.cn",
			Origin: "https://jwxt.hbut.edu.cn",
		},
		withCredentials: true,
	};

	const response = await hbutRequest.get(
		"/admin/xsd/xsdcjcx/getCurrentXnxq",
		 loginConfig);
	if(response.data.ret === 0){
		return response.data.data;
	}
	else{
		console.log("获取当前学期失败")
		return "";

	}
}
