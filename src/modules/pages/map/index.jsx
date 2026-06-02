import StaticListPage from "../../../components/StaticListPage";
import { mapGroups } from "../../data/staticPages";

export default function Index() {
	return (
		<StaticListPage
			title="校园地图"
			groups={mapGroups}
			searchPlaceholder="搜索地点"
		/>
	);
}
