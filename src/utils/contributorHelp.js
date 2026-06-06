// Gitee 登录名 → 显示名 映射表
// 如需修改贡献者显示名称，在这里添加映射即可
export const NAME_OVERRIDES = {
  "王博康": "欧立谢特",
};

export function cleanContributors(data) {
  if (!Array.isArray(data)) {
    throw new TypeError('参数必须为贡献者数组');
  }
  return {
    contributors_count: data.length,
    contributors: data.map(item => ({
      name: NAME_OVERRIDES[item.name] || item.name || '',
      email: item.email || '',
      commits: parseInt(item.contributions, 10) || 0
    }))
  };
}
