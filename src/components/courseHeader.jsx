// components/CourseHeader.jsx
import { View, Image, Text, ScrollView } from "@tarojs/components";
import { useState, useEffect } from "react";
import Btn from "./Btn";
import { getAllWeek } from "../service/hubt/GetAllWeek";

export default function CourseHeader({
	currentWeek,
	onWeekChange,
	className = "",
}) {
	const [weekList, setWeekList] = useState([]);
	const [showPicker, setShowPicker] = useState(false);

	useEffect(() => {
		getAllWeek().then((list) => setWeekList(list || []));
	}, []);

	const handleSelectWeek = (week) => {
		setShowPicker(false);
		onWeekChange?.(week);
	};

	const closePicker = () => setShowPicker(false);

	return (
		<>
			<View
				className={className}
				style={{
					padding: "4px",
					marginBottom: "16px",
					height: "40px",
					display: "flex",
					gap: "18px",
					alignItems: "center",
				}}
			>
				<Btn>
					<View className="fa fa-list-ul" />
				</Btn>
				<Btn onClick={() => setShowPicker(true)}>
					<Text>第{currentWeek ?? "?"}周</Text>
					<View className="fa fa-angle-down" />
				</Btn>
			</View>

			{/* 周数选择弹窗 */}
			{showPicker && (
				<View
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0,0,0,0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1000,
					}}
					onClick={closePicker}
				>
					<View
						style={{
							width: "80%",
							maxWidth: "500px",
							backgroundColor: "#fff",
							borderRadius: "16px",
							overflow: "hidden",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{/* 标题 */}
						<View
							style={{
								textAlign: "center",
								padding: "16px",
								fontSize: "30px",
								fontWeight: "bold",
								color: "#000",
							}}
						>
							选择周数
						</View>

						{/* 可滚动区域，隐藏滚动条 */}
						<ScrollView
							scrollY
							enhanced
							showScrollbar={false}
							style={{
								maxHeight: "400px",
							}}
						>
							<View style={{ padding: "16px" }}>
								<View
									style={{
										display: "grid",
										gridTemplateColumns: "repeat(6, 1fr)",
										gap: "12px",
									}}
								>
									{weekList.map((week) => {
										const isSelected = currentWeek === week;
										return (
											<View
												key={week}
												onClick={() =>
													handleSelectWeek(week)
												}
												style={{
													aspectRatio: "1 / 1",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													borderRadius: "8px",
													backgroundColor: isSelected
														? "#fff"
														: "#47a5fd",
													border: isSelected
														? "2px solid #47a5fd"
														: "none",
													color: isSelected
														? "#47a5fd"
														: "#fff",
													fontSize: "20px",
													fontWeight: "bold",
													cursor: "pointer",
												}}
											>
												{week}
											</View>
										);
									})}
								</View>
							</View>
						</ScrollView>
					</View>
				</View>
			)}
		</>
	);
}
