import { View, Text, Image, Input, ScrollView } from "@tarojs/components";
import Taro, { useLoad, useDidShow } from "@tarojs/taro";
import { useState, useCallback, useRef } from "react";
import { AtIcon } from "taro-ui";
import SafeAreaView from "../../../components/SafeAreaView";
import HeadStatus from "../../../components/HeadStatus";
import { getBookList, getBookCategories } from "../../../service";
import { getColorFromName } from "../../../utils/getHashCode";
import runtimeLogger from "../../../utils/runtimeLogger";
import "./index.css";

export default function Index() {
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState(["全部"]);
  const [activeCategory, setActiveCategory] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState("loading"); // 'loading'|'error'|'done'|'empty'
  const [refreshing, setRefreshing] = useState(false);
  const [sortMode, setSortMode] = useState("time"); // 'time' | 'hot'
  const debounceRef = useRef(null);

  const fetchList = useCallback(
    async (p = 1, kw = keyword, cat = activeCategory, srt = sortMode, append = false) => {
      try {
        const data = await getBookList(
          { page: p, pageSize: 20, keyword: kw, category: cat, sort: srt },
        );
        if (append && p > 1) {
          setBooks((prev) => [...prev, ...(data.books || [])]);
        } else {
          setBooks(data.books || []);
        }
        setTotal(data.total || 0);
        setPage(p);
        const hasData = (data.books || []).length > 0;
        setLoading(hasData ? "done" : "empty");
      } catch (error) {
        runtimeLogger.error("BookList", "加载书籍列表失败", error);
        Taro.showToast({ title: "加载失败", icon: "none" });
        if (!append) {
          // 保留已有数据不覆盖
          setLoading(books.length === 0 ? "error" : "done");
        }
      }
    },
    [keyword, activeCategory, sortMode, books.length],
  );

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await getBookCategories();
      setCategories(cats || ["全部"]);
    } catch {
      // 分类加载失败使用默认值，不阻塞列表
    }
  }, []);

  useLoad(() => {
    fetchCategories();
    fetchList(1);
  });

  useDidShow(() => {
    fetchList(1);
  });

  const handleSearch = (value) => {
    setKeyword(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchList(1, value, activeCategory, sortMode);
    }, 300);
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setLoading("loading");
    fetchList(1, keyword, cat, sortMode);
  };

  const handleSortChange = (mode) => {
    setSortMode(mode);
    setLoading("loading");
    fetchList(1, keyword, activeCategory, mode);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchList(1, keyword, activeCategory, sortMode).finally(() => setRefreshing(false));
  };

  const handleLoadMore = () => {
    if (books.length >= total) return;
    fetchList(page + 1, keyword, activeCategory, sortMode, true);
  };

  const handleRetry = () => {
    setLoading("loading");
    fetchList(1);
  };

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
        />
        <HeadStatus text="二手书" />
      </View>

      {/* 搜索栏 */}
      <View className="search-bar">
        <View className="search-input-wrap">
          <AtIcon value="search" size={16} color="#999" />
          <Input
            className="search-input"
            placeholder="搜索书名/书号"
            value={keyword}
            onInput={(e) => handleSearch(e.detail.value)}
          />
        </View>
      </View>

      {/* 类别筛选 */}
      <ScrollView scrollX className="category-scroll" enhanced bounces={false}>
        <View className="category-list">
          {categories.map((cat) => (
            <View
              key={cat}
              className={`category-tag ${activeCategory === cat ? "category-tag-active" : ""}`}
              onClick={() => handleCategoryChange(cat)}
            >
              <Text>{cat}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 排序切换栏 */}
      <View className="sort-bar">
        <View className="sort-left">
          <AtIcon value={sortMode === "time" ? "clock" : "heart"} size={16} color={sortMode === "time" ? "#47a5fd" : "#e74c3c"} />
          <Text className={`sort-label ${sortMode === "time" ? "sort-label-active" : ""}`}>
            {sortMode === "time" ? "最新书籍" : "最热书籍"}
          </Text>
        </View>
        <View className="sort-right" onClick={() => handleSortChange(sortMode === "time" ? "hot" : "time")}>
          <AtIcon value="swap" size={14} color="#47a5fd" />
          <Text className="sort-toggle-text">
            {sortMode === "time" ? "按时间排序" : "按热度排序"}
          </Text>
        </View>
      </View>

      {/* 列表 */}
      {loading === "loading" && books.length === 0 ? (
        <View className="book-grid">
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="book-card skeleton-card">
              <View className="card-img skeleton-img" />
              <View className="card-body">
                <View className="skeleton-line skeleton-line-short" />
                <View className="skeleton-line skeleton-line-long" />
                <View className="skeleton-line skeleton-line-mid" />
              </View>
            </View>
          ))}
        </View>
      ) : loading === "error" && books.length === 0 ? (
        <View className="empty-view" onClick={handleRetry}>
          <Text className="empty-text">加载失败，点击重试</Text>
        </View>
      ) : loading === "empty" ? (
        <View className="empty-view">
          <Text className="empty-text">暂无书籍</Text>
        </View>
      ) : (
        <ScrollView
          scrollY
          className="book-grid-scroll"
          onScrollToLower={handleLoadMore}
          lowerThreshold={80}
          refresherEnabled
          refresherTriggered={refreshing}
          onRefresherRefresh={handleRefresh}
          enhanced
          bounces={false}
        >
          <View className="book-grid">
            {books.map((book) => (
              <View
                key={book.id}
                className="book-card"
                onClick={() =>
                  Taro.navigateTo({
                    url: `/modules/pages/book/detail/index?id=${book.id}`,
                  })
                }
              >
                <View className="card-img">
                  {book.images && book.images.length > 0 ? (
                    <Image
                      className="card-img-pic"
                      src={book.images[0].url}
                      mode="aspectFill"
                    />
                  ) : (
                    <View
                      className="card-img-placeholder"
                      style={{ background: getColorFromName(book.name || "书") }}
                    >
                      <Text className="placeholder-text">
                        {(book.name || "书")[0]}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="card-body">
                  <Text className="card-name">{book.name}</Text>
                  <Text className="card-category">{book.category || "未分类"}</Text>
                  <View className="card-price-row">
                    <Text className="card-price">
                      <Text className="price-symbol">¥</Text>
                      <Text className="price-number">{book.price}</Text>
                    </Text>
                    <Text className="card-want">{book.wantCount || 0}人想要</Text>
                  </View>
                  <View className="card-publisher-row">
                    <View
                      className="card-avatar"
                      style={{ background: getColorFromName(book.publisherName || "?") }}
                    >
                      <Text className="card-avatar-text">
                        {(book.publisherName || "?")[0]}
                      </Text>
                    </View>
                    <Text className="card-publisher">{book.publisherName || "未知"}</Text>
                  </View>
                  <View className="card-delivery-row">
                    <Text className={`delivery-tag ${book.isDelivery === 1 ? "delivery-send" : "delivery-pickup"}`}>
                      {book.isDelivery === 1 ? "可送" : "自提"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          {books.length >= total && books.length > 0 && (
            <View className="list-footer">
              <Text className="footer-text">— 已加载全部 —</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB 悬浮按钮 */}
      <View
        className="fab-btn"
        onClick={() =>
          Taro.navigateTo({ url: "/modules/pages/book/edit/index" })
        }
      >
        <Text className="fab-text">+</Text>
      </View>
    </SafeAreaView>
  );
}
