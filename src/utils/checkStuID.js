import Taro from "@tarojs/taro";
/**
 *
 * @param {string} 学号
 * @returns {boolean} 验证结果
 */
export function checkStuID(stuID) {
	if (!stuID) {
		Taro.showToast({
			title: "学号不能为空",
			icon: "error"
		});
		return false;
	}
	if (stuID.length > 20) {
		Taro.showToast({
			title: "学号长度不正确",
			icon: "error"
		});
		return false;
	}
	if (!/^[0-9]*$/.test(stuID)) {
		Taro.showToast({
			title: "学号只能包含数字",
			icon: "error"
		});
		return false;
	}
	return true;
}
