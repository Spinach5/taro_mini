import { View } from "@tarojs/components";
import { getSafeArea } from "../service/safeArea";

export default function SaveAreaView({ children, className = "" }) {
	const safeArea = (() => {
		const { top, bottom } = getSafeArea();
		console.log("全局安全距离获取一次:", { top, bottom });
		return { top, bottom };
	})();
	return (
		<View
			className={className}
			style={{
				height: "100%",
				paddingTop: `${safeArea.top}px`,
				paddingBottom: `${safeArea.bottom}px`,
				paddingLeft: "8px",
				paddingRight: "8px",
				background: `linear-gradient(to bottom, rgba(71,165,253) 0%, rgba(255,255,255) 40%)`,
				boxSizing: "border-box",
			}}
		>
			{children}
		</View>
	);
}
