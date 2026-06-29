import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import "./index.css";
import SafeAreaView from "../../../components/base/SafeAreaView";
import HeadStatus from "../../../components/layout/HeadStatus";
import { AtIcon } from "taro-ui";

export default function Index() {
	return (
		<SafeAreaView className="safearea">
			{/* 返回按钮 */}
			<View className="uniform-page-header">
				<AtIcon
					value="arrow-left"
					color="#ffffff"
					onClick={() =>
						Taro.switchTab({ url: "/pages/index/index" })
					}
				/>
				<HeadStatus text="行政" />
			</View>
			<View className="header">
				{/* 搜索组件 */}
				{/* <InputBar placeholder={"搜索"} onInput={(input) => {
            }}></InputBar> */}
				{/* 分类选择器 */}
				{/* <CategoryFilter
                allText={'全部'}
                categories={clubcategory}
                onChange={(category) => {  }}
            /> */}
			</View>

			{/* 卡片 */}
			<View className="admin-list">
				{/* <!-- 学籍证明类 --> */}
				<View className="category-group">
					<View className="group-title">学籍证明类</View>
					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">在读证明/学籍证明</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									北16学生一站式服务中心自助打印机
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://jwc.hbut.edu.cn/"
								>
									https://jwc.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									自助机24小时可用，无需辅导员签字，官方公示可直接使用
								</Text>
							</View>
						</View>
					</View>

					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">中文成绩单打印</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									北16学生一站式服务中心自助打印机
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://jwc.hbut.edu.cn/"
								>
									https://jwc.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									在校生免费打印，带公章有效，无需再去教务办盖章
								</Text>
							</View>
						</View>
					</View>

					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">学生证补办</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									学生公共服务中心自助办理机
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://xgb.hbut.edu.cn/"
								>
									https://xgb.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									无需登报挂失，线上挂失后可直接补办，即时领卡
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* <!-- 选课教务类 --> */}
				<View className="category-group">
					<View className="group-title">选课教务类</View>
					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">课程退选/改选</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									教务系统线上申请（开课2周内）
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://jwc.hbut.edu.cn/"
								>
									https://jwc.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									超过2周官方不予受理，无特殊审批通道
								</Text>
							</View>
						</View>
					</View>

					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">缓考申请</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									学院教务办提交书面材料+医院证明
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://jwc.hbut.edu.cn/"
								>
									https://jwc.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									仅疾病等官方规定情形可申请，无正规证明不予通过
								</Text>
							</View>
						</View>
					</View>

					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">重修报名</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									教务系统开放时段内自主报名
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://jwc.hbut.edu.cn/"
								>
									https://jwc.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									重修随下一年级上课，错过报名期需等下一学期
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* <!-- 评奖资助类 --> */}
				<View className="category-group">
					<View className="group-title">评奖资助类</View>
					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">国家/校内奖学金</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									班级→学院评审→校内公示
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://xgb.hbut.edu.cn/"
								>
									https://xgb.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									评审规则公开，名额按学院分配，具体分配细则不对外公示
								</Text>
							</View>
						</View>
					</View>

					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">国家助学金</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									提交认定材料→学院评议→公示
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://xgb.hbut.edu.cn/"
								>
									https://xgb.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									按困难等级+学院评议确定，非仅以家庭经济情况判定
								</Text>
							</View>
						</View>
					</View>

					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">勤工助学岗位</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									学院通知+校内部门面试
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://xgb.hbut.edu.cn/"
								>
									https://xgb.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									岗位信息仅通过学院QQ群、院内通知发布
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* <!-- 宿舍后勤类 --> */}
				<View className="category-group">
					<View className="group-title">宿舍后勤类</View>
					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">宿舍设施报修</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									线上报修平台/宿管现场登记
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://hq.hbut.edu.cn/"
								>
									https://hq.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									线上报修响应速度快于线下找宿管登记
								</Text>
							</View>
						</View>
					</View>

					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">校园网办理</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									线上营业厅缴费开通
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://nic.hbut.edu.cn/"
								>
									https://nic.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									校内30元/月不限流量，校外访问按官方规定方式使用
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* <!-- 医保健康类 --> */}
				<View className="category-group">
					<View className="group-title">医保健康类</View>
					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">校医院就诊与转诊</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									先校医院首诊，按规定办理转诊
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://xyy.hbut.edu.cn/"
								>
									https://xyy.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									未按流程转诊，官方医保报销不予受理
								</Text>
							</View>
						</View>
					</View>

					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">医保报销</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									校医院提交完整报销材料
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://xyy.hbut.edu.cn/"
								>
									https://xyy.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									材料不全将被退回，需按官方清单补齐
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* <!-- 证件生活类 --> */}
				<View className="category-group">
					<View className="group-title">证件生活类</View>
					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">校园卡挂失/补卡</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									食堂/自助服务机线上挂失+补卡
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://ecard.hbut.edu.cn/"
								>
									https://ecard.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									挂失后账户立即冻结，补卡可即时领取
								</Text>
							</View>
						</View>
					</View>

					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">集体户口相关证明</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									保卫处登记→派出所办理
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://bwc.hbut.edu.cn/"
								>
									https://bwc.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									证明需到派出所开具，保卫处仅做登记审核
								</Text>
							</View>
						</View>
					</View>
				</View>

				{/* <!-- 毕业手续类 --> */}
				<View className="category-group">
					<View className="group-title">毕业手续类</View>
					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">离校手续办理</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									按部门顺序完成审核盖章
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://jwc.hbut.edu.cn/"
								>
									https://jwc.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									有欠费、图书未归还等情况无法完成审核
								</Text>
							</View>
						</View>
					</View>

					<View className="item-card">
						<View className="item-header">
							<Text className="item-name">档案转递</Text>
						</View>
						<View className="item-content">
							<View className="content-row">
								<Text className="label">官方办理渠道：</Text>
								<Text className="value">
									学工处按就业/升学信息统一寄送
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">官方公开链接：</Text>
								<Text
									className="value link"
									bindtap="openLink"
									data-url="https://xgb.hbut.edu.cn/"
								>
									https://xgb.hbut.edu.cn/
								</Text>
							</View>
							<View className="content-row">
								<Text className="label">补充内容：</Text>
								<Text className="value">
									档案由学校统一转递，学生个人不得自带
								</Text>
							</View>
						</View>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}
