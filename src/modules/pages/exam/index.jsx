import StaticListPage from "../../../components/StaticListPage";
import { dailyGroups } from "../../data/staticPages";

export default function Index() {
	return (
		<StaticListPage
			title="日常用品"
			groups={dailyGroups}
			searchPlaceholder="搜索商品或地点"
		/>
	);
}
