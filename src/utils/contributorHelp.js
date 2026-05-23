// export function cleanContributors(data) {
// 	if (!data) return {};
// 	const { contributors_count, contributors } = data;
// 	return {
// 		contributors_count: parseInt(contributors_count, 10) || 0,
// 		contributors: contributors.map((item) => {
// 			const avatar = item.image_path || "";
// 			const isValidUrl = /^https?:\/\//.test(avatar);
// 			return {
// 				name: item.name || "",
// 				avatar: isValidUrl ? avatar : "",
// 				commits: parseInt(item.commits_count, 10) || 0,
// 			};
// 		}),
// 	};
// }
export function cleanContributors(data) {
  if (!Array.isArray(data)) {
    throw new TypeError('参数必须为贡献者数组');
  }
  return {
    contributors_count: data.length,
    contributors: data.map(item => ({
      name: item.name || '',
      email: item.email || '',
      commits: parseInt(item.contributions, 10) || 0
    }))
  };
}
