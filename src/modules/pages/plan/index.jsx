import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Picker } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import SafeAreaView from "../../../components/base/SafeAreaView";
import Loading from "../../../components/base/Loading";
import { getTrainPlan } from "../../../service/schools/hbut/trainPlan";
import { getCourseProperty } from "../../../service/schools/hbut/getCourseProperty";
import { getColorFromName } from "../../../utils/common/getHashCode";
import userManager from "../../../service/userInfo";
import { AtIcon } from "taro-ui";
import HeadStatus from "../../../components/layout/HeadStatus";
import "./index.css";

const GRADE_OPTIONS = ["大一", "大二", "大三", "大四"];
const SEMESTER_OPTIONS = ["1", "2"];

function FilterBar({ selectedGrade, selectedSemester, onGradeChange, onSemesterChange, onSearch }) {
  return (
    <View className="filter-bar">
      <Picker
        mode="selector"
        range={GRADE_OPTIONS}
        value={selectedGrade}
        onChange={(e) => onGradeChange(e.detail.value)}
      >
        <View className="filter-item bora">
          <Text className="filter-label">年级</Text>
          <View className="filter-value">
            <Text>{GRADE_OPTIONS[selectedGrade] || "请选择"}</Text>
            <Text className="filter-arrow">▼</Text>
          </View>
        </View>
      </Picker>

      <Picker
        mode="selector"
        range={SEMESTER_OPTIONS}
        value={selectedSemester}
        onChange={(e) => onSemesterChange(e.detail.value)}
      >
        <View className="filter-item bora">
          <Text className="filter-label">学期</Text>
          <View className="filter-value">
            <Text>第{SEMESTER_OPTIONS[selectedSemester]}学期</Text>
            <Text className="filter-arrow">▼</Text>
          </View>
        </View>
      </Picker>

      <View className="search-btn bora" onClick={onSearch}>
        <AtIcon value="search" size={20} color="#fff" className="search-icon" />
        <Text className="search-text">查询</Text>
      </View>
    </View>
  );
}

function CourseCard({ course, propertyMap, onClick }) {
  const propertyName = propertyMap[course.kcxz] || course.kcxz || "未知";
  const propertyColor = getColorFromName(propertyName);

  return (
    <View className="course-card bora" onClick={() => onClick(course)}>
      <View className="course-card-left">
        <Text className="course-name">{course.kcmc}</Text>
        <Text className="course-info">学分：{course.xf}</Text>
        <Text className="course-info">学时：{course.zongxs}</Text>
      </View>
      <Text className="course-property" style={{ color: propertyColor }}>
        {propertyName}
      </Text>
    </View>
  );
}

function DetailModal({ course, propertyMap, onClose }) {
  if (!course) return null;

  const propertyName = propertyMap[course.kcxz] || course.kcxz || "未知";
  const propertyColor = getColorFromName(propertyName);

  return (
    <View className="modal-overlay" onClick={onClose}>
      <View className="modal-content bora" onClick={(e) => e.stopPropagation()}>
        <View className="modal-header">
          <Text className="modal-title">{course.kcmc}</Text>
          <View className="modal-close" onClick={onClose}>
            <Text className="close-icon">×</Text>
          </View>
        </View>
        <ScrollView scrollY className="modal-body">
          <View className="detail-row">
            <Text className="detail-label">课程编号</Text>
            <Text className="detail-value">{course.kcbh || "-"}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">课程性质</Text>
            <Text className="detail-value" style={{ color: propertyColor }}>
              {propertyName}
            </Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">学分</Text>
            <Text className="detail-value">{course.xf || "-"}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">总学时</Text>
            <Text className="detail-value">{course.zongxs || "-"}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">开课学院</Text>
            <Text className="detail-value">{course.kkyxmc || "-"}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">是否必修</Text>
            <Text className="detail-value">{course.sfbx}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">是否实践环节</Text>
            <Text className="detail-value">{course.sfsjhj === "1" ? "是" : course.sfsjhj === "0" ? "否" : "-"}</Text>
          </View>
          {course.sjzs && (
            <View className="detail-row">
              <Text className="detail-label">实践周数</Text>
              <Text className="detail-value">{course.sjzs} 周</Text>
            </View>
          )}
        </ScrollView>
        <View className="modal-footer">
          <View className="confirm-btn bora" onClick={onClose}>
            <Text className="confirm-text">关闭</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function Index() {
  const [selectedGrade, setSelectedGrade] = useState(0);
  const [selectedSemester, setSelectedSemester] = useState(0);
  const [courses, setCourses] = useState([]);
  const [propertyMap, setPropertyMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [initReady, setInitReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [initError, setInitError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const checkLoginStatus = useCallback(() => {
    try {
      const loggedIn = userManager.checkLogin();
      if (loggedIn && !isLoggedIn) {
        setIsLoggedIn(true);
      } else if (!loggedIn && isLoggedIn === true) {
        setIsLoggedIn(false);
      } else if (isLoggedIn === null) {
        setIsLoggedIn(loggedIn);
      }
    } catch (error) {
      console.error("获取登录状态失败", error);
      setIsLoggedIn(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  useDidShow(() => {
    checkLoginStatus();
  });

  useEffect(() => {
    if (isLoggedIn !== true) return;

    const init = async () => {
      try {
        const properties = await getCourseProperty();

        const reversedMap = {};
        Object.entries(properties || {}).forEach(([name, code]) => {
          reversedMap[code] = name;
        });
        setPropertyMap(reversedMap);

        setInitReady(true);
      } catch (err) {
        console.error("初始化培养计划数据失败", err);
        setInitError(true);
        Taro.showToast({ title: "初始化失败", icon: "none" });
      }
    };
    init();
  }, [isLoggedIn]);

  const fetchCourses = useCallback(async () => {
    if (!initReady) return;

    const grade = String(selectedGrade + 1);
    const kkxq = String(selectedSemester + 1);

    setLoading(true);
    try {
      const data = await getTrainPlan(grade, kkxq);
      setCourses(data || []);
    } catch (err) {
      console.error("查询培养计划失败", err);
      Taro.showToast({ title: "查询失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, [initReady, selectedGrade, selectedSemester]);

  const handleGradeChange = useCallback((value) => {
    setSelectedGrade(parseInt(value, 10));
  }, []);

  const handleSemesterChange = useCallback((value) => {
    setSelectedSemester(parseInt(value, 10));
  }, []);

  const handleSearch = useCallback(() => {
    setHasSearched(true);
    fetchCourses();
  }, [fetchCourses]);

  const handleCardClick = useCallback((course) => {
    setSelectedCourse(course);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedCourse(null);
  }, []);

  if (isLoggedIn === null) {
    return (
      <SafeAreaView>
        <Loading />
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <AtIcon
            value="arrow-left"
            color="#ffffff"
            onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
          />
          <HeadStatus text="培养计划" />
        </View>
        <View className="notLoginView">
          <Text className="notLoginText">请先登录!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
        />
        <HeadStatus text="培养计划" />
      </View>
      <View className="plan-page">
        <FilterBar
          selectedGrade={selectedGrade}
          selectedSemester={selectedSemester}
          onGradeChange={handleGradeChange}
          onSemesterChange={handleSemesterChange}
          onSearch={handleSearch}
        />

        {initError ? (
          <View className="empty-view">
            <Text className="empty-text">初始化失败</Text>
          </View>
        ) : !initReady ? (
          <View className="empty-view">
            <Loading />
          </View>
        ) : loading ? (
          <View className="empty-view">
            <Loading />
          </View>
        ) : !hasSearched ? (
          <View className="empty-view">
            <Text className="empty-text">请选择学期后点击查询</Text>
          </View>
        ) : courses.length === 0 ? (
          <View className="empty-view">
            <Text className="empty-text">暂无课程信息</Text>
          </View>
        ) : (
          <ScrollView scrollY className="course-list">
            {courses.map((course, index) => (
              <CourseCard
                key={course.kcbh || course.kcmc + index}
                course={course}
                propertyMap={propertyMap}
                onClick={handleCardClick}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <DetailModal
        course={selectedCourse}
        propertyMap={propertyMap}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
}
