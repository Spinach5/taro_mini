import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, Picker } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";
import SafeAreaView from "../../../components/SafeAreaView";
import Loading from "../../../components/Loading";
import { getTeachBuilding, getTeachBuildingCategory } from "../../../service/hbut/getTeachBuilding";
import { getAllWeek } from "../../../service/hbut/GetAllWeek";
import { getTimeTable } from "../../../service/hbut/GetTimeTable";
import { getEmptyRoom } from "../../../service/hbut/getEmptyClassRoom";
import { getCurrentWeek } from "../../../service/hbut/CurrentWeek";
import { getSemesterList } from "../../../service/hbut/CurrentSemester";
import { getColorFromName } from "../../../utils/getHashCode";
import userManager from "../../../service/userInfo";
import "./index.scss";

const WEEKDAY_OPTIONS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

function getTodayWeekday() {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

function FilterBar({ buildingNames, weekOptions, sectionOptions, selected, onChange, onSearch }) {
  const weekdayRange = WEEKDAY_OPTIONS;

  return (
    <View className="filter-bar">
      <Picker
        mode="selector"
        range={buildingNames}
        value={selected.building}
        onChange={(e) => onChange("building", e.detail.value)}
      >
        <View className="filter-item">
          <Text className="filter-label">教学楼</Text>
          <View className="filter-value">
            <Text>{buildingNames[selected.building] || "全部"}</Text>
            <Text className="filter-arrow">▼</Text>
          </View>
        </View>
      </Picker>

      <Picker
        mode="selector"
        range={weekOptions}
        value={selected.week}
        onChange={(e) => onChange("week", e.detail.value)}
      >
        <View className="filter-item">
          <Text className="filter-label">周次</Text>
          <View className="filter-value">
            <Text>第{weekOptions[selected.week]}周</Text>
            <Text className="filter-arrow">▼</Text>
          </View>
        </View>
      </Picker>

      <Picker
        mode="selector"
        range={weekdayRange}
        value={selected.weekday}
        onChange={(e) => onChange("weekday", e.detail.value)}
      >
        <View className="filter-item">
          <Text className="filter-label">星期</Text>
          <View className="filter-value">
            <Text>{weekdayRange[selected.weekday]}</Text>
            <Text className="filter-arrow">▼</Text>
          </View>
        </View>
      </Picker>

      <Picker
        mode="multiSelector"
        range={[sectionOptions, sectionOptions]}
        value={selected.section}
        onChange={(e) => {
          let [start, end] = e.detail.value;
          if (end < start) [start, end] = [end, start];
          onChange("section", [start, end]);
        }}
      >
        <View className="filter-item">
          <Text className="filter-label">节次</Text>
          <View className="filter-value">
            <Text>
              第{sectionOptions[selected.section[0]]}-{sectionOptions[selected.section[1]]}节
            </Text>
            <Text className="filter-arrow">▼</Text>
          </View>
        </View>
      </Picker>

      <View className="search-btn" onClick={onSearch}>
        <Text className="search-icon">🔍</Text>
        <Text className="search-text">搜索</Text>
      </View>
    </View>
  );
}

function RoomCard({ room, typeName }) {
  const typeColor = getColorFromName(typeName || room.jslx || "默认");

  return (
    <View className="room-card">
      <View className="room-card-left">
        <Text className="room-name">{room.jsmc}</Text>
        <Text className="room-info">{room.jxlmc}</Text>
        <Text className="room-seats">{room.maxvolume}座</Text>
      </View>
      <Text className="room-type" style={{ color: typeColor }}>
        {typeName || "-"}
      </Text>
    </View>
  );
}

export default function Index() {
  const [buildingMap, setBuildingMap] = useState({});
  const [categoryMap, setCategoryMap] = useState({});
  const [weekOptions, setWeekOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);

  const [selectedBuilding, setSelectedBuilding] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedWeekday, setSelectedWeekday] = useState(() => getTodayWeekday() - 1);
  const [selectedSection, setSelectedSection] = useState([0, 1]);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initReady, setInitReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [initError, setInitError] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  const buildingList = useMemo(() => [
    { name: "全部", code: "" },
    ...Object.entries(buildingMap).map(([name, code]) => ({ name, code })),
  ], [buildingMap]);
  const buildingNames = useMemo(() => buildingList.map((b) => b.name), [buildingList]);

  useEffect(() => {
    if (isLoggedIn !== true) return;

    const init = async () => {
      try {
        const semesterList = await getSemesterList();
        const semester = semesterList[semesterList.length - 1];

        const [buildings, weeks, timetable, categories, currentWeek] =
          await Promise.all([
            getTeachBuilding(),
            getAllWeek(semester),
            getTimeTable(semester),
            getTeachBuildingCategory(),
            getCurrentWeek(),
          ]);

        setBuildingMap(buildings || {});

        const weekNums = (weeks || []).map((w) => w.zc).sort((a, b) => a - b);
        setWeekOptions(weekNums);

        const sectionNums = (timetable || []).map((t) => parseInt(t.jc)).filter(Boolean);
        setSectionOptions(sectionNums);

        setCategoryMap(categories || {});

        const weekIdx = weekNums.indexOf(Number(currentWeek));
        if (weekIdx !== -1) setSelectedWeek(weekIdx);

        if (sectionNums.length >= 2) {
          setSelectedSection([0, 1]);
        }

        setInitReady(true);
      } catch (err) {
        console.error("初始化空教室数据失败", err);
        setInitError(true);
        Taro.showToast({ title: "初始化失败", icon: "none" });
      }
    };
    init();
  }, [isLoggedIn]);

  const fetchRooms = useCallback(async () => {
    if (!initReady) return;

    const building = buildingList[selectedBuilding];
    const weekNum = weekOptions[selectedWeek];
    const weekdayNum = selectedWeekday + 1;
    const startJc = sectionOptions[selectedSection[0]];
    const endJc = sectionOptions[selectedSection[1]];

    if (building === undefined || weekNum === undefined || !startJc || !endJc) return;

    const range = [];
    for (let i = startJc; i <= endJc; i++) range.push(i);
    const sectionStr = range.join(",");

    setLoading(true);
    try {
      const data = await getEmptyRoom(building.code, weekNum, weekdayNum, sectionStr);
      setRooms(data || []);
    } catch (err) {
      console.error("查询空教室失败", err);
      Taro.showToast({ title: "查询失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, [
    initReady,
    selectedBuilding,
    selectedWeek,
    selectedWeekday,
    selectedSection,
    buildingList,
    weekOptions,
    sectionOptions,
  ]);

  const handleFilterChange = useCallback((key, value) => {
    if (key === "building") setSelectedBuilding(value);
    if (key === "week") setSelectedWeek(value);
    if (key === "weekday") setSelectedWeekday(value);
    if (key === "section") setSelectedSection(value);
  }, []);

  const handleSearch = useCallback(() => {
    setHasSearched(true);
    fetchRooms();
  }, [fetchRooms]);

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
        <View className="notLoginView">
          <Text className="notLoginText">请先登录!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <View className="empty-room-page">
        <FilterBar
          buildingNames={buildingNames}
          weekOptions={weekOptions}
          sectionOptions={sectionOptions}
          selected={{
            building: selectedBuilding,
            week: selectedWeek,
            weekday: selectedWeekday,
            section: selectedSection,
          }}
          onChange={handleFilterChange}
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
            <Text className="empty-text">请选择筛选条件后点击搜索</Text>
          </View>
        ) : rooms.length === 0 ? (
          <View className="empty-view">
            <Text className="empty-text">暂无空闲教室</Text>
          </View>
        ) : (
          <ScrollView scrollY className="room-list">
            {rooms.map((room, index) => (
              <RoomCard
                key={room.jsmc || index}
                room={room}
                typeName={categoryMap[room.jslx]}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
