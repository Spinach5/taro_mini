import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, Picker, Input } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import SafeAreaView from "../../../components/base/SafeAreaView";
import Loading from "../../../components/base/Loading";
import PageHeader from "../../../components/business/PageHeader";
import DetailModal from "../../../components/business/DetailModal";
import { getMaterialList, getMaterialSemesters, getMaterialClasses } from "../../../service/schools/hbut/material";
import userManager from "../../../service/userInfo";
import "./index.scss";

const safeText = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if ('String' in val && 'Valid' in val) return val.Valid ? String(val.String) : '';
    if ('Number' in val && 'Valid' in val) return val.Valid ? String(val.Number) : '';
    return '';
  }
  return String(val);
};

export default function MaterialIndex() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [semesterList, setSemesterList] = useState([]);
  const [classList, setClassList] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(false);

  const [semesterIdx, setSemesterIdx] = useState(0);
  const [classKeyword, setClassKeyword] = useState('');
  const [selectedClassItem, setSelectedClassItem] = useState(null);
  const [showClassSuggestions, setShowClassSuggestions] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);

  const semesterOptions = useMemo(() => ["请选择学期", ...semesterList], [semesterList]);

  const filteredClassSuggestions = useMemo(() => {
    if (!classKeyword) return classList.slice(0, 10);
    const keyword = classKeyword.toLowerCase();
    return classList.filter(c => c.class_name.toLowerCase().includes(keyword)).slice(0, 10);
  }, [classKeyword, classList]);

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

  const initData = useCallback(async (forceRefresh = false) => {
    if (!isLoggedIn) return;
    try {
      const [semesters, classes] = await Promise.all([
        getMaterialSemesters(forceRefresh),
        getMaterialClasses(forceRefresh),
      ]);
      setSemesterList(semesters || []);
      setClassList(classes || []);
    } catch (err) {
      console.error("获取基础数据失败", err);
      setInitError(true);
      Taro.showToast({ title: "获取数据失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchMaterialList = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const selectedSemester = semesterIdx > 0 ? semesterList[semesterIdx - 1] : null;
      const selectedClass = selectedClassItem ? selectedClassItem.class_name : null;

      if (selectedSemester) {
        const result = await getMaterialList({
          semester: selectedSemester,
          class_name: selectedClass || undefined,
        });
        setMaterials(result.materials || []);
      }
    } catch (err) {
      console.error("获取教材数据失败", err);
      Taro.showToast({ title: "查询失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, semesterIdx, selectedClassItem, semesterList]);

  useEffect(() => {
    if (isLoggedIn !== true) return;
    initData();
  }, [isLoggedIn, initData]);

  usePullDownRefresh(() => {
    initData(true).finally(() => {
      Taro.stopPullDownRefresh();
    });
  });

  const handleSemesterChange = useCallback((e) => {
    const idx = Number(e.detail.value);
    setSemesterIdx(idx);
    setSelectedClassItem(null);
    setClassKeyword('');
  }, []);

  const handleClassInput = useCallback((e) => {
    const value = e.detail.value || '';
    setClassKeyword(value);
    setShowClassSuggestions(true);
    if (!value) {
      setSelectedClassItem(null);
    }
  }, []);

  const handleSelectClass = useCallback((classItem) => {
    setSelectedClassItem(classItem);
    setClassKeyword(classItem.class_name);
    setShowClassSuggestions(false);
  }, []);

  const handleClearClass = useCallback(() => {
    setClassKeyword('');
    setSelectedClassItem(null);
    setShowClassSuggestions(false);
  }, []);

  const handleSearch = useCallback(async () => {
    if (semesterIdx === 0) {
      Taro.showToast({ title: "请先选择学期", icon: "none" });
      return;
    }
    setShowClassSuggestions(false);
    await fetchMaterialList();
  }, [semesterIdx, fetchMaterialList]);

  const handleMaterialClick = useCallback((material) => {
    setCurrentMaterial(material);
    setShowDetail(true);
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
        <PageHeader
          title="教材查询"
          onBack={() => Taro.switchTab({ url: "/pages/index/index" })}
        />
        <View className="empty-view">
          <Text className="empty-text">请先登录!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <PageHeader
        title="教材查询"
        onBack={() => Taro.switchTab({ url: "/pages/index/index" })}
      />

      <View className="filter-bar">
        <Picker
          mode="selector"
          range={semesterOptions}
          value={semesterIdx}
          onChange={handleSemesterChange}
        >
          <View className="filter-item bora">
            <Text className="filter-label">学期</Text>
            <View className="filter-value">
              <Text className="filter-text">{semesterOptions[semesterIdx]}</Text>
              <Text className="filter-arrow">▼</Text>
            </View>
          </View>
        </Picker>
      </View>

      <View className="filter-bar">
        <View className="filter-item class-input-wrapper">
          <Text className="filter-label">班级</Text>
          <View className="class-input-row">
            <Input
              className="class-input"
              value={classKeyword}
              placeholder="输入班级名称搜索"
              placeholderClass="class-input-placeholder"
              onInput={handleClassInput}
              onFocus={() => setShowClassSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowClassSuggestions(false), 300);
              }}
              confirmType="search"
            />
            {classKeyword && (
              <View className="clear-btn" onClick={handleClearClass}>
                <Text className="clear-icon">✕</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {showClassSuggestions && filteredClassSuggestions.length > 0 && (
        <View className="class-suggestions">
          {filteredClassSuggestions.map((item) => (
            <View
              key={item.class_id}
              className="suggestion-item"
              hoverClass="suggestion-item-hover"
              onClick={() => handleSelectClass(item)}
            >
              <Text className="suggestion-name">{safeText(item.class_name)}</Text>
              <Text className="suggestion-major">{safeText(item.major)}</Text>
            </View>
          ))}
        </View>
      )}
      {showClassSuggestions && filteredClassSuggestions.length === 0 && classKeyword && (
        <View className="class-suggestions empty">
          <Text className="no-result">未找到匹配的班级</Text>
        </View>
      )}

      <View className="filter-bar" style={{ paddingTop: 0 }}>
        <View
          className="filter-item bora"
          style={{ flex: 1, textAlign: "center", padding: "20rpx" }}
          onClick={handleSearch}
        >
          <Text className="filter-text" style={{ color: "#47a5fd" }}>查询教材</Text>
        </View>
      </View>

      <View className="material-page">
        {initError ? (
          <View className="empty-view">
            <Text className="empty-text">加载失败</Text>
          </View>
        ) : loading ? (
          <View className="empty-view">
            <Loading />
          </View>
        ) : materials.length === 0 ? (
          <View className="empty-view">
            <Text className="empty-text">暂无教材数据</Text>
          </View>
        ) : (
          <ScrollView scrollY className="material-list">
            {materials.map((item, index) => (
              <View
                key={index}
                className="material-card"
                onClick={() => handleMaterialClick(item)}
              >
                <Text className="card-title">{safeText(item.title)}</Text>
                <View className="card-meta">
                  {item.author && (
                    <Text className="meta-item">
                      <Text className="meta-label">作者：</Text>
                      <Text>{safeText(item.author)}</Text>
                    </Text>
                  )}
                  {item.publisher && (
                    <Text className="meta-item">
                      <Text className="meta-label">出版社：</Text>
                      <Text>{safeText(item.publisher)}</Text>
                    </Text>
                  )}
                  {item.isbn && (
                    <Text className="meta-item">
                      <Text className="meta-label">ISBN：</Text>
                      <Text>{safeText(item.isbn)}</Text>
                    </Text>
                  )}
                </View>
                <Text className="card-price">¥{safeText(item.price) || 0}</Text>
                {item.extra_info && (
                  <Text className="card-extra">{safeText(item.extra_info)}</Text>
                )}
                {item.classes && item.classes.length > 0 && (
                  <View className="card-classes">
                    {item.classes.map((cls, idx) => (
                      <Text key={idx} className="class-tag">{safeText(cls)}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {showDetail && currentMaterial && (
        <DetailModal
          visible={showDetail}
          title={safeText(currentMaterial.title)}
          onClose={() => setShowDetail(false)}
        >
          <View className="detail-row">
            <Text className="detail-label">ISBN</Text>
            <Text className="detail-value">{safeText(currentMaterial.isbn) || "-"}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">作者</Text>
            <Text className="detail-value">{safeText(currentMaterial.author) || "-"}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">出版社</Text>
            <Text className="detail-value">{safeText(currentMaterial.publisher) || "-"}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">价格</Text>
            <Text className="detail-value">¥{safeText(currentMaterial.price) || 0}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">学期</Text>
            <Text className="detail-value">{safeText(currentMaterial.semester) || "-"}</Text>
          </View>
          {currentMaterial.extra_info && (
            <View className="detail-row">
              <Text className="detail-label">备注</Text>
              <Text className="detail-value">{safeText(currentMaterial.extra_info)}</Text>
            </View>
          )}
          {currentMaterial.classes && currentMaterial.classes.length > 0 && (
            <View className="detail-row classes-row">
              <Text className="detail-label">适用班级</Text>
              <View className="detail-value classes-tags">
                {currentMaterial.classes.map((cls, idx) => (
                  <Text key={idx} className="class-tag">{safeText(cls)}</Text>
                ))}
              </View>
            </View>
          )}
        </DetailModal>
      )}
    </SafeAreaView>
  );
}
