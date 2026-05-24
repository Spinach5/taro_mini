// src/service/router.js
import * as hbut from './hbut';
import * as wust from './wust';
import userManager from './userInfo';

const SCHOOL_MAP = {
  '湖北工业大学': hbut,
  '': wust,
};

export function getSchool() {
  return SCHOOL_MAP[userManager.getUniversity()] || hbut;
}
