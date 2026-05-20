/**
 * 获取学期列表
 * @param {string} InitYear  - 入学年份，如 "2024"
 * @param {string} CurrentSemester - 当前学期，如 "2025-2026-2"
 * @returns {Array<string>} 从入学到当前学期的所有学期字符串数组
 */
export function getSemesterList(InitYear, CurrentSemester) {
  const startYear = parseInt(InitYear, 10);
  // 解析当前学期：例如 "2025-2026-2" -> year=2025, semester=2
  const parts = CurrentSemester.split('-');
  const targetYear = parseInt(parts[0], 10);
  const targetSemester = parseInt(parts[2], 10);

  const result = [];
  let year = startYear;
  let sem = 1; // 入学第一学期

  while (true) {
    const term = `${year}-${year + 1}-${sem}`;
    result.push(term);
    // 如果已经到达目标学期，停止
    if (year === targetYear && sem === targetSemester) {
      break;
    }
    // 推进到下一学期
    if (sem === 1) {
      sem = 2; // 同一年春季学期
    } else {
      sem = 1;
      year += 1; // 进入下一学年秋季学期
    }
  }

  return result;
}
