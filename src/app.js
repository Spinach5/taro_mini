import Taro,{ useLaunch,useLoad} from "@tarojs/taro";
import "./app.css";
import "taro-ui/lib/style/index.scss";
import runtimeLogger from "./utils/runtimeLogger";
import { ThemeProvider } from "./utils/theme";
import "taro-icons/scss/MaterialCommunityIcons.scss";

function App({ children }) {
	useLaunch(async () => {
		runtimeLogger.info("App", `应用启动 (${process.env.TARO_ENV || "unknown"})`);
	});
	useLoad(() => {
		if(process.env.TARO_ENV === "weapp"){
			Taro.cloud.init({
			env: process.env.TARO_WEAPP_CLOUD,
		});
		}

	});
	return <ThemeProvider>{children}</ThemeProvider>;
}

export default App;
