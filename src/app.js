import { useLaunch } from "@tarojs/taro";
import safeAreaManager from "./utils/safeArea";
import "./app.scss";
import cacheManager from "./utils/cache";

function App({ children }) {
	useLaunch(async () => {
		console.log("App launched.");

		// 异步初始化缓存
		console.log("清空缓存")
		await cacheManager.clear();

		// 异步初始化安全距离
		await safeAreaManager.init();
		console.log("安全距离初始化完成");



	});

	return children;
}

export default App;
