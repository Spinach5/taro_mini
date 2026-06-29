// src/service/router.js
import * as hbut from './schools/hbut';
import userManager from './userInfo';

const SCHOOL_MAP = {
  '湖北工业大学': hbut,
};

export function getSchool() {
  return SCHOOL_MAP[userManager.getUniversity()] || hbut;
}
