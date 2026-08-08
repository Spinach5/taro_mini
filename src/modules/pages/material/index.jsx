import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, Picker, Input, Image } from "@tarojs/components";
import Taro, { useDidShow, usePullDownRefresh } from "@tarojs/taro";
import SafeAreaView from "../../../components/base/SafeAreaView";
import Loading from "../../../components/base/Loading";
import PageHeader from "../../../components/business/PageHeader";
import DetailModal from "../../../components/business/DetailModal";
import { getMaterialList, getMaterialSemesters, getMaterialClasses } from "../../../service/schools/hbut/material";
import userManager from "../../../service/userInfo";
import { API_BASE, ISBN_KEY } from "../../../config/api";
import runtimeLogger from "../../../utils/common/runtimeLogger";
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
  const [authState, setAuthState] = useState(null); // null=loading, "login"=need login, "register"=need expand, "ok"=passed
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
  const [coverUrl, setCoverUrl] = useState(null);
  const [coverLoading, setCoverLoading] = useState(false);

  const semesterOptions = useMemo(() => ["请选择学期", ...semesterList], [semesterList]);

  const filteredClassSuggestions = useMemo(() => {
    if (!classKeyword) return classList.slice(0, 10);
    const keyword = classKeyword.toLowerCase();
    return classList.filter(c => c.class_name.toLowerCase().includes(keyword)).slice(0, 10);
  }, [classKeyword, classList]);

  const checkAuth = useCallback(() => {
    try {
      if (!userManager.checkLogin()) {
        if (authState !== "login") setAuthState("login");
        return false;
      }
      if (!userManager.getServerToken()) {
        if (authState !== "register") setAuthState("register");
        return false;
      }
      if (authState !== "ok") setAuthState("ok");
      return true;
    } catch (error) {
      console.error("获取登录状态失败", error);
      setAuthState("login");
      return false;
    }
  }, [authState]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useDidShow(() => {
    checkAuth();
  });

  const initData = useCallback(async (forceRefresh = false) => {
    if (authState !== "ok") return;
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
  }, [authState]);

  const fetchMaterialList = useCallback(async () => {
    if (authState !== "ok") return;
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
  }, [authState, semesterIdx, selectedClassItem, semesterList]);

  useEffect(() => {
    if (authState !== "ok") return;
    initData();
  }, [authState, initData]);

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

  const fetchIsbnCover = useCallback(async (isbnCode) => {
    if (!isbnCode) {
      setCoverUrl(null);
      return;
    }
    setCoverLoading(true);
    setCoverUrl(null);
    try {
      const apiKey = ISBN_KEY;
      const apiUrl = `${API_BASE.isbn}/openApi/getInfoByIsbn?isbn=${encodeURIComponent(isbnCode)}&appKey=${encodeURIComponent(apiKey)}`;
      const res = await Taro.request({ url: apiUrl, method: "GET" });
      const json = res.data;
      if (json && json.success && json.code === 0 && json.data) {
        let pics = [];
        try {
          pics = typeof json.data.pictures === "string" ? JSON.parse(json.data.pictures) : json.data.pictures;
        } catch { /* ignore */ }
        if (Array.isArray(pics) && pics.length > 0) {
          setCoverUrl(pics[0]);
        } else {
          setCoverUrl(null);
        }
      } else {
        setCoverUrl(null);
      }
    } catch (error) {
      runtimeLogger.error("Material", "获取教材封面失败", error);
      setCoverUrl(null);
    } finally {
      setCoverLoading(false);
    }
  }, []);

  const handleMaterialClick = useCallback((material) => {
    setCurrentMaterial(material);
    setShowDetail(true);
    fetchIsbnCover(safeText(material.isbn));
  }, [fetchIsbnCover]);

  if (authState === null) {
    return (
      <SafeAreaView>
        <Loading />
      </SafeAreaView>
    );
  }

  if (authState === "login") {
    return (
      <SafeAreaView>
        <PageHeader
          title="教材查询"
          onBack={() => Taro.switchTab({ url: "/pages/index/index" })}
        />
        <View className="empty-view">
          <Text className="empty-text">请先登录</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (authState === "register") {
    return (
      <SafeAreaView>
        <PageHeader
          title="教材查询"
          onBack={() => Taro.switchTab({ url: "/pages/index/index" })}
        />
        <View className="empty-view">
          <Text className="empty-text">请先在设置中注册拓展功能</Text>
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

      <View className="page-content" onClick={() => setShowClassSuggestions(false)}>

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
              onClick={(e) => { e.stopPropagation(); handleSelectClass(item); }}
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
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      </View>

      {showDetail && currentMaterial && (
        <DetailModal
          visible={showDetail}
          title={safeText(currentMaterial.title)}
          onClose={() => setShowDetail(false)}
        >
          <View className="detail-cover-row">
            <View className="detail-label">封面</View>
            <View className="detail-cover-wrapper">
              {coverLoading ? (
                <View className="cover-placeholder">
                  <Text className="cover-placeholder-text">加载中...</Text>
                </View>
              ) : coverUrl ? (
                <Image
                  className="detail-cover"
                  src={coverUrl}
                  mode="widthFix"
                  lazyLoad
                />
              ) : (
                <View className="cover-placeholder">
                  <Text className="cover-placeholder-text">未知</Text>
                </View>
              )}
            </View>
          </View>
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
