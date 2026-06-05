import { useState, useEffect, useCallback } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { useRouter, useDidShow, usePullDownRefresh } from "@tarojs/taro";
import SafeAreaView from "../../../components/SafeAreaView";
import Loading from "../../../components/Loading";
import SemesterSelector from "../../../components/SemesterSelector";
import HeadStatus from "../../../components/HeadStatus";
import Btn from "../../../components/Btn";
import { AtIcon } from "taro-ui";
import { getSemesterList } from "../../../service/hbut/CurrentSemester";
import { getExamInfo } from "../../../service/hbut/ExamInfo";
import userManager from "../../../service/userInfo";
import "./index.scss";

function parseExamTime(kssj) {
  const [datePart, timePart] = kssj.split(" ");
  const [startTime, endTime] = timePart.split("~");
  const start = new Date(`${datePart}T${startTime}:00`);
  const end = new Date(`${datePart}T${endTime}:00`);
  return { start, end };
}

function getExamStatus(kssj) {
  const { start, end } = parseExamTime(kssj);
  const now = Date.now();
  if (now < start.getTime()) return { text: "待开始", color: "#07c160" };
  if (now <= end.getTime()) return { text: "进行中", color: "#f0ad4e" };
  return { text: "已结束", color: "#999" };
}

function formatExamDate(kssj) {
  const [datePart, timePart] = kssj.split(" ");
  const [, month, day] = datePart.split("-");
  return `${month}-${day} ${timePart}`;
}

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [semesterList, setSemesterList] = useState([]);
  const [currentSemester, setCurrentSemester] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkLoginStatus = useCallback(() => {
    try {
      const loggedIn = userManager.checkLogin();
      if (loggedIn && !isLoggedIn) {
        setIsLoggedIn(true);
      } else if (!loggedIn && isLoggedIn === true) {
        setIsLoggedIn(false);
        setSemesterList([]);
        setExams([]);
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
    if (!isLoggedIn) return;
    getSemesterList()
      .then((list) => {
        setSemesterList(list);
        if (list && list.length) {
          setCurrentSemester(list[list.length - 1]);
        }
      })
      .catch((err) => {
        console.error("获取学期列表失败", err);
        Taro.showToast({ title: "获取学期失败", icon: "none" });
      });
  }, [isLoggedIn]);

  const handleSemesterChange = useCallback((selected) => {
    if (selected && selected !== currentSemester) {
      setCurrentSemester(selected);
    }
  }, [currentSemester]);

  const fetchExams = useCallback(async (forceRefresh = false) => {
    if (!isLoggedIn || !currentSemester) return;
    setLoading(true);
    try {
      const data = await getExamInfo(currentSemester, forceRefresh);
      setExams(data.exams || []);
    } catch (err) {
      console.error("获取考试信息失败", err);
      Taro.showToast({ title: "获取考试信息失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, currentSemester]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  usePullDownRefresh(() => {
    fetchExams(true).finally(() => {
      Taro.stopPullDownRefresh();
    });
  });

  if (isLoggedIn === null) {
    return (
      <SafeAreaView >
        <Loading />
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView >
		 <View className="uniform-page-header">
				<AtIcon
				  value="arrow-left"
				  color="#ffffff"
				  onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
				/>
				<HeadStatus text="考试" />
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
        <HeadStatus text="考试" />
      </View>

      <View className="semester-bar">
		<Text className="semester-label">学期选择:</Text>
        <SemesterSelector
          semesterList={semesterList}
          currentSemester={currentSemester}
          onChange={handleSemesterChange}
        >
          <Btn>
            <Text>{currentSemester ?? "选择学期"}</Text>
            <AtIcon value="chevron-down" size={20} />
          </Btn>
        </SemesterSelector>
      </View>

      <View className="exam-page">

        {loading ? (
          <Loading />
        ) : exams.length === 0 ? (
          <View className="emptyView">
            <Text className="emptyText">暂无考试信息</Text>
          </View>
        ) : (
          exams.map((exam, index) => {
              const status = getExamStatus(exam.kssj);
              return (
                <View key={index} className="exam-card">
                  <Text className="exam-subject">{exam.kcmc}</Text>
                  <View className="exam-info">
                    <Text className="exam-info-item">考试批次: {exam.kspcmc}</Text>
                    <Text className="exam-info-item">教室: {exam.jsmc}</Text>
                    <Text className="exam-info-item">时间: {formatExamDate(exam.kssj)}</Text>
                    <Text className="exam-info-item">方式: {exam.ksfs}</Text>
                    <Text className="exam-info-item">座位: {exam.zwh}</Text>
                  </View>
                  <Text
                    className="exam-status"
                    style={{ color: status.color }}
                  >
                    {status.text}
                  </Text>
                </View>
              );
            })
        )}
      </View>
    </SafeAreaView>
  );
}
