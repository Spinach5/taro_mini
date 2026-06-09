import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, Picker } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import SafeAreaView from "../../../components/SafeAreaView";
import Loading from "../../../components/Loading";
import HeadStatus from "../../../components/HeadStatus";
import { AtIcon } from "taro-ui";
import { getScores } from "../../../service/hbut/getScores";
import { getSemesterList } from "../../../service/hbut/CurrentSemester";
import userManager from "../../../service/userInfo";
import "./index.scss";

const PASS_OPTIONS = ["全部", "及格", "不及格"];
const SORT_OPTIONS = ["请选择", "成绩从高到低", "成绩从低到高"];

function getScoreColor(score) {
  if (score == null || Number.isNaN(score)) return "#999";
  if (score >= 80) return "#07c160";
  if (score >= 60) return "#f0ad4e";
  return "#e74c3c";
}

function getScoreText(score) {
  if (score == null || Number.isNaN(score)) return "--";
  return String(score);
}

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [semesterList, setSemesterList] = useState([]);
  const [allScores, setAllScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(false);

  const [semesterIdx, setSemesterIdx] = useState(0);
  const [passIdx, setPassIdx] = useState(0);
  const [sortIdx, setSortIdx] = useState(0);

  const semesterOptions = useMemo(() => ["全部", ...semesterList], [semesterList]);

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

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const semesters = await getSemesterList();
      setSemesterList(semesters || []);

      const latestSemester = (semesters && semesters.length > 0) ? semesters[semesters.length - 1] : "all";
      const scores = await getScores(latestSemester, forceRefresh);
      setAllScores(scores || []);
    } catch (err) {
      console.error("获取成绩数据失败", err);
      if (forceRefresh) {
        Taro.showToast({ title: "刷新失败", icon: "none" });
      } else {
        setInitError(true);
        Taro.showToast({ title: "获取成绩失败", icon: "none" });
      }
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn !== true) return;
    fetchData();
  }, [isLoggedIn, fetchData]);

  usePullDownRefresh(() => {
    fetchData(true).finally(() => {
      Taro.stopPullDownRefresh();
    });
  });

  // 前端过滤与排序
  const filteredScores = useMemo(() => {
    let list = [...allScores];

    // 学期过滤
    if (semesterIdx > 0) {
      const target = semesterList[semesterIdx - 1];
      list = list.filter((s) => s.xnxq === target);
    }

    // 及格过滤
    if (passIdx === 1) {
      list = list.filter((s) => s.zhcj >= 60);
    } else if (passIdx === 2) {
      list = list.filter((s) => s.zhcj < 60);
    }

    // 排序
    if (sortIdx === 1) {
      list.sort((a, b) => b.zhcj - a.zhcj);
    } else if (sortIdx === 2) {
      list.sort((a, b) => a.zhcj - b.zhcj);
    }

    return list;
  }, [allScores, semesterIdx, passIdx, sortIdx, semesterList]);

  const handlePickerChange = useCallback((key, value) => {
    // Taro Picker onChange 可能返回字符串类型，显式转为数字
    const numValue = Number(value);
    if (key === "semester") setSemesterIdx(numValue);
    if (key === "pass") setPassIdx(numValue);
    if (key === "sort") setSortIdx(numValue);
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
        <HeadStatus text="成绩" />
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
        <HeadStatus text="成绩" />
      </View>

      <View className="filter-bar">
        <Picker
          mode="selector"
          range={semesterOptions}
          value={semesterIdx}
          onChange={(e) => handlePickerChange("semester", e.detail.value)}
        >
          <View className="filter-item bora">
            <Text className="filter-label">学期</Text>
            <View className="filter-value">
              <Text className="filter-text">{semesterOptions[semesterIdx]}</Text>
              <Text className="filter-arrow">▼</Text>
            </View>
          </View>
        </Picker>

        <Picker
          mode="selector"
          range={PASS_OPTIONS}
          value={passIdx}
          onChange={(e) => handlePickerChange("pass", e.detail.value)}
        >
          <View className="filter-item">
            <Text className="filter-label">是否及格</Text>
            <View className="filter-value">
              <Text className="filter-text">{PASS_OPTIONS[passIdx]}</Text>
              <Text className="filter-arrow">▼</Text>
            </View>
          </View>
        </Picker>

        <Picker
          mode="selector"
          range={SORT_OPTIONS}
          value={sortIdx}
          onChange={(e) => handlePickerChange("sort", e.detail.value)}
        >
          <View className="filter-item">
            <Text className="filter-label">排序</Text>
            <View className="filter-value">
              <Text className="filter-text">{SORT_OPTIONS[sortIdx]}</Text>
              <Text className="filter-arrow">▼</Text>
            </View>
          </View>
        </Picker>
      </View>

      <View className="score-page">
        {initError ? (
          <View className="empty-view">
            <Text className="empty-text">加载失败</Text>
          </View>
        ) : loading ? (
          <View className="empty-view">
            <Loading />
          </View>
        ) : filteredScores.length === 0 ? (
          <View className="empty-view">
            <Text className="empty-text">暂无成绩</Text>
          </View>
        ) : (
          <ScrollView scrollY className="score-list">
            {filteredScores.map((item, index) => {
              const color = getScoreColor(item.zhcj);
              const text = getScoreText(item.zhcj);
              return (
                <View className="score-card bora" key={index}>
                  <View className="score-card-left">
                    <Text className="score-course-name">{item.kcmc}</Text>
                    <Text className="score-meta">
                      {item.xnxq} | {item.xf} 学分 | 补考：{item.sfbk === "1" ? "是" : "否"}
                    </Text>
                  </View>
                  <Text className="score-value" style={{ color }}>
                    {text}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
