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
  const debounceRef = useRef(null);

  const fetchList = useCallback(
    async (p = 1, kw = keyword, cat = activeCategory, append = false) => {
      try {
        const data = await getBookList(
          { page: p, pageSize: 20, keyword: kw, category: cat },
          p === 1 && !kw && cat === "全部", // 仅首页无筛选时 forceRefresh
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
    [keyword, activeCategory, books.length],
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
      fetchList(1, value, activeCategory);
    }, 300);
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setLoading("loading");
    fetchList(1, keyword, cat);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchList(1).finally(() => setRefreshing(false));
  };

  const handleLoadMore = () => {
    if (books.length >= total) return;
    fetchList(page + 1, keyword, activeCategory, true);
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

      {/* 列表 */}
      {loading === "loading" && books.length === 0 ? (
        <View className="skeleton-list">
          {[1, 2, 3].map((i) => (
            <View key={i} className="book-card skeleton-card">
              <View className="card-thumb skeleton-thumb" />
              <View className="card-info">
                <View className="skeleton-line skeleton-line-long" />
                <View className="skeleton-line skeleton-line-short" />
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
          className="book-list"
          onScrollToLower={handleLoadMore}
          lowerThreshold={80}
          refresherEnabled
          refresherTriggered={refreshing}
          onRefresherRefresh={handleRefresh}
          enhanced
          bounces={false}
        >
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
              <View
                className="card-thumb"
                style={{
                  background: getColorFromName(book.name || "书"),
                }}
              >
                {book.images && book.images.length > 0 ? (
                  <Image
                    className="thumb-img"
                    src={book.images[0].url}
                    mode="aspectFill"
                  />
                ) : (
                  <Text className="thumb-placeholder">
                    {(book.name || "书")[0]}
                  </Text>
                )}
              </View>
              <View className="card-info">
                <Text className="card-name">{book.name}</Text>
                <Text className="card-price">¥{book.price}</Text>
                <View className="card-meta">
                  <Text className="card-publisher">{book.publisherName}</Text>
                  {book.category && (
                    <>
                      <Text className="meta-dot">·</Text>
                      <Text className="meta-tag">{book.category}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          ))}
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
