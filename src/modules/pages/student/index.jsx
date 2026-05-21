import StaticListPage from "../../../components/StaticListPage";
import { studentGroups } from "../../data/staticPages";

export default function Index() {
	return (
		<StaticListPage
			title="学生会"
			groups={studentGroups}
			searchPlaceholder="搜索部门或职能"
		/>
	);
}
