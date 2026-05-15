import { useState } from "react";
import { View, Text, Input, Button, Picker, Image } from "@tarojs/components";
import "./index.css";
import HeadStatus from "../../components/headStatus";
import SafeAreaView from "../../components/safeView";
import img from "../../assets/微信.png";
import Taro from "@tarojs/taro";

export default function Index() {
	const [university, setUniversity] = useState("湖北工业大学");
	const [studentId, setStudentId] = useState("");
	const [password, setPassword] = useState("");
	const [agreed, setAgreed] = useState(false);

	// 大学列表（只展示湖北工业大学）
	const universityList = ["湖北工业大学"];

	const handleLogin = () => {
		if (!studentId || !password) {
			console.log("请填写学号和密码");
			return;
		}
		if (!agreed) {
			console.log("请阅读并同意用户协议和隐私政策");
			return;
		}
		console.log("登录中...", { university, studentId, password });
	};

	return (
		<SafeAreaView>
			<View className="login-container">
				<View
					className="back-btn"
					onClick={() => Taro.switchTab({ url: "/pages/user/index" })}
				>
					<Text className="back-icon">←</Text>
				</View>
				<HeadStatus text="门户登录" />

				{/* 顶部区域 */}
				<View className="header">
					<Picker
						mode="selector"
						range={universityList}
						value={0}
						onChange={(e) =>
							setUniversity(universityList[e.detail.value])
						}
					>
						<View className="university-picker">
							<Text className="university-name">
								{university}
							</Text>
							<Text className="arrow">▼</Text>
						</View>
					</Picker>
					<Text className="subtitle">统一身份认证</Text>
				</View>

				{/* 登录表单 */}
				<View className="form">
					<View className="input-item">
						<Text className="input-label">学号</Text>
						<Input
							className="input-field"
							placeholder="请输入学号"
							placeholderClass="placeholder"
							value={studentId}
							onInput={(e) => setStudentId(e.detail.value)}
						/>
					</View>

					<View className="input-item">
						<Text className="input-label">密码</Text>
						<Input
							className="input-field"
							placeholder="请输入密码"
							placeholderClass="placeholder"
							password
							value={password}
							onInput={(e) => setPassword(e.detail.value)}
						/>
					</View>

					<Button className="login-btn" onClick={handleLogin}>
						登录
					</Button>

					{/* 协议同意区域 */}
					<View
						className="agreement"
						onClick={() => setAgreed(!agreed)}
					>
						<View className={`checkbox ${agreed ? "checked" : ""}`}>
							{agreed && <Text className="checkmark">✓</Text>}
						</View>
						<Text className="agreement-text">
							我已阅读并同意{" "}
							<Text className="link">用户协议</Text> 和
							<Text className="link"> 隐私政策</Text>
						</Text>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}
