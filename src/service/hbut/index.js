/** 湖北工业大学教务 API 统一导出 */
export { auth }              from './auth';
export { getAllSchedule }    from './AllSchedule';
export { getAllWeek }        from './GetAllWeek';
export { getCredits }        from './QueryCredit';
export { getCurrentWeek }    from './CurrentWeek';
export { getDailySchedule }  from './DailySchedule';
export { getExamInfo }       from './ExamInfo';
export { getExtroInfo }       from './ExtroInfo';
export { getSemesterList }   from './CurrentSemester';
export { getScores }         from './Scores';
export { getStuInfo }        from './StuInfo';
export { getTimeTable }      from './GetTimeTable';
export { getAllClub, getClubCategories, getClubDetail, addClub } from './clubs';
export {
  getBookList, getBookCategories, getBookDetail,
  createBook, updateBook, toggleWantBook,
  uploadBookImage, deleteBookImage,
  getFavoriteBookIds, addFavoriteBookId, removeFavoriteBookId, isFavoriteBook,
} from './book';
export { getExamBatch }      from './getExamBatch';
export { getTeachBuilding }  from './getTeachBuilding';
export { getTeachBuildingCategory }  from './getTeachBuilding';
export { getEmptyRoom }      from "./getEmptyClassRoom"
export { getBanner }         from "./Banner"
