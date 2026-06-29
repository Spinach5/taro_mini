/**
 * 清洗课程数据：合并同一天内同一课程的不同节次记录
 * @param {Array} courseList - 原始课程数据列表
 * @returns {Array} 清洗后的课程列表，每个对象包含：
 *   kcmc, tmc, croommc, xqmc, jxbzc, kcxz,
 *   zcstr (数组), xf, zongxs, xingqi, djc (数组)
 */
function stripHtml(str) {
  return (str || '').replace(/<[^>]*>/g, '');
}

export function extractCourseData(courseList) {
  const map = new Map();

  for (const item of courseList) {
    const name = stripHtml(item.kcmc);
    // 生成唯一键：课程名 + 周次串 + 星期几
    const key = `${name}|${item.zcstr}|${item.xingqi}|${item.djs}`;

    if (!map.has(key)) {
      // 首次遇到：创建清洗后的对象
      map.set(key, {
        kcmc: name,
        tmc: stripHtml(item.tmc),
        croommc: stripHtml(item.croommc),
        xqmc: item.xqmc,
        jxbzc: stripHtml(item.jxbzc),
        kcxz: item.kcxz,
        zcstr: item.zcstr.split(',').map(Number), // 周次转数字数组
        xf: item.xf,
        zongxs: item.zongxs,
        xingqi: item.xingqi,
        djc: [item.djc],              // 节次初始化为数组
		djs:item.djs
      });
    } else {
      // 同一天、同一课程的另一个节次，压入 djc 数组
      const exist = map.get(key);
      exist.djc.push(item.djc);
      // 可选：如果有必要，检查其他字段是否一致，此处略
    }
  }

  // 返回数组，并将 djc 排序（方便阅读）
  return Array.from(map.values()).map(course => {
    course.djc.sort((a, b) => a - b);
    return course;
  });
}
