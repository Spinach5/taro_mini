//src/service/AddSchedule.js
import cacheManager from "../utils/common/cache";
/**添加课程
 *@param {object} schedule
 */
const CACHE_KEY = "All_COURSE_"; // 定义缓存key
export function addSchedule(semester,schedule) {
	const allCourse = cacheManager.get(CACHE_KEY + semester);//allCourse是课程数据,是一个数组
	if(allCourse){
		allCourse.push(schedule);
		cacheManager.set(CACHE_KEY + semester, allCourse);
	}else{
		cacheManager.set(CACHE_KEY + semester, [schedule]);
	}
}


