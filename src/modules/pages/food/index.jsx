import StaticListPage from "../../../components/StaticListPage";
import { foodGroups } from "../../data/staticPages";

export default function Index() {
	return (
		<StaticListPage
			title="美食"
			groups={foodGroups}
			searchPlaceholder="搜索餐厅或美食"
		/>
	);
}
