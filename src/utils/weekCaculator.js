/**
 * 根据当前周数推算目标周数所在的月份
 * @param {number} currentWeek - 当前所处的学期周数（如第10周）
 * @param {number} targetWeek - 要查询的另一个周数
 * @returns {number} 目标周数所在月份（1-12）
 *
 * 规则：
 * 1. 以周一作为一周的第一天。
 * 2. 如果一周跨月，以周一所在月份为准。
 * 3. 通过调用时的实际日期和 currentWeek 反推学期第一周的周一，
 *    再计算 targetWeek 对应周的周一，最终返回该周一所在的月份。
 */
export function getMonthOfWeek(currentWeek, targetWeek) {
  const today = new Date();

  // 计算今天距离本周一的天数（周一为第一天）
  const dayOfWeek = today.getDay(); // 0=周日, 1=周一, ..., 6=周六
  const daysToMonday = (dayOfWeek + 6) % 7; // 周一:0, 周二:1, …, 周日:6

  // 本周一的日期
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysToMonday);

  // 学期第1周的周一 = 本周一 - (当前周数 - 1) * 7 天
  const firstMonday = new Date(thisMonday);
  firstMonday.setDate(thisMonday.getDate() - (currentWeek - 1) * 7);

  // 目标周的周一 = 第1周周一 + (目标周数 - 1) * 7 天
  const targetMonday = new Date(firstMonday);
  targetMonday.setDate(firstMonday.getDate() + (targetWeek - 1) * 7);

  // 返回该周一所在的月份（getMonth() 返回 0-11，需 +1）
  return targetMonday.getMonth() + 1;
}
