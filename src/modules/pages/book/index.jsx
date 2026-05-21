import StaticListPage from "../../../components/StaticListPage";
import { bookGroups } from "../../data/staticPages";

export default function Index() {
	return (
		<StaticListPage
			title="二手书"
			groups={bookGroups}
			searchPlaceholder="搜索书名"
		/>
	);
}
