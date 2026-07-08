import Taro, { useLaunch } from "@tarojs/taro";
import "./app.css";
import "taro-ui/lib/style/index.scss";
import "taro-icons/scss/MaterialCommunityIcons.scss";
import runtimeLogger from "./utils/common/runtimeLogger";
import { checkAndAutoLogin } from "./service/autoLogin";

// 云端初始化必须在模块顶层调用，不能放在 useLaunch 里（useLaunch 是异步的，可能在页面渲染后才执行）
Taro.cloud.init({
	env: process.env.TARO_WEAPP_CLOUD,
});

function App({ children }) {
	useLaunch(async () => {
		runtimeLogger.info("App", `应用启动 (${process.env.TARO_ENV || "unknown"})`);
		checkAndAutoLogin(); // 异步不阻塞，后台静默执行
	});

	return children;
}

export default App;
