import { View, Text, Image, Input, ScrollView } from "@tarojs/components";
import Taro, { useLoad, useDidShow, usePullDownRefresh } from "@tarojs/taro";
import { useState, useCallback, useMemo, useRef } from "react";
import { AtIcon } from "taro-ui";
import { MaterialCommunityIcons } from "taro-icons";
import SafeAreaView from "../../../components/base/SafeAreaView";
import HeadStatus from "../../../components/layout/HeadStatus";
import { getBookList, getBookCategories, getFavoriteBookIds } from "../../../service";
import { getColorFromName } from "../../../utils/common/getHashCode";
import userManager from "../../../service/userInfo";
import cacheManager from "../../../utils/common/cache";
import runtimeLogger from "../../../utils/common/runtimeLogger";
import "./index.css";

const BOOK_TYPE_OPTIONS = [
  { label: "全部", value: "" },
  { label: "出售", value: "1" },
  { label: "求购", value: "2" },
];

/** 排序：自己的书 > 已收藏 > 其他，组内按时/按热度 */
function sortBooks(list, currentUserId, favIds, sort) {
  return [...list].sort((a, b) => {
    const aOwn = a.user_id === currentUserId ? 0 : 1;
    const bOwn = b.user_id === currentUserId ? 0 : 1;
    if (aOwn !== bOwn) return aOwn - bOwn;
    const aFav = favIds.includes(a.id) ? 0 : 1;
    const bFav = favIds.includes(b.id) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    if (sort === "hot") {
      return (b.wantCount || 0) - (a.wantCount || 0);
    }
    return (b.publishTime || "").localeCompare(a.publishTime || "");
  });
}

/** 本地关键字过滤 */
function filterBooks(list, kw) {
  if (!kw) return list;
  const lower = kw.toLowerCase();
  return list.filter((b) =>
    (b.name || "").toLowerCase().includes(lower) ||
    (b.isbn || "").toLowerCase().includes(lower)
  );
}

export default function Index() {
  const [allBooks, setAllBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCats, setSelectedCats] = useState([]); // 多选种类，空=全部
  const [bookType, setBookType] = useState(""); // ""全部 "1"出售 "2"求购
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState("loading");
  const [sortMode, setSortMode] = useState("time");
  const [favIds, setFavIds] = useState([]);
  const [imgErrors, setImgErrors] = useState({});
  const debounceRef = useRef(null);
  const currentUserId = userManager.getServerUserId();

  const fetchList = useCallback(
    async (p = 1, forceRefresh = false) => {
      try {
        const data = await getBookList(
          { page: p, pageSize: 200 },
          forceRefresh,
        );
        const favs = getFavoriteBookIds();
        setFavIds(favs);
        if (p === 1) {
          setAllBooks(data.books || []);
        } else {
          setAllBooks((prev) => [...prev, ...(data.books || [])]);
        }
        setTotal(data.total || 0);
        setPage(p);
        const hasData = (data.books || []).length > 0;
        setLoading(hasData ? "done" : "empty");
      } catch (error) {
        runtimeLogger.error("BookList", "加载书籍列表失败", error);
        Taro.showToast({ title: "加载失败", icon: "none" });
        if (allBooks.length === 0) setLoading("error");
      }
    },
    [allBooks.length],
  );

  // 本地筛选 + 排序
  const books = useMemo(() => {
    let list = filterBooks(allBooks, keyword);
    // bookType 筛选
    if (bookType) {
      list = list.filter((b) => String(b.book_type) === bookType);
    }
    // 多选种类筛选（空=全部）
    if (selectedCats.length > 0) {
      list = list.filter((b) => selectedCats.includes(b.category));
    }
    return sortBooks(list, currentUserId, favIds, sortMode);
  }, [allBooks, keyword, bookType, selectedCats, sortMode, favIds, currentUserId]);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await getBookCategories();
      setCategories((cats || []).filter((c) => c !== "全部"));
    } catch {}
  }, []);

  useLoad(() => {
    fetchCategories();
    fetchList(1);
  });

  useDidShow(() => {
    const favs = getFavoriteBookIds();
    setFavIds(favs);
    const cached = cacheManager.get("v1_books");
    if (cached && Array.isArray(cached.books)) {
      setAllBooks(cached.books);
    } else {
      fetchList(1);
    }
  });

  usePullDownRefresh(() => {
    fetchList(1, true).finally(() => Taro.stopPullDownRefresh());
  });

  const handleSearch = (value) => {
    setKeyword(value);
  };

  const handleCatToggle = (cat) => {
    setSelectedCats((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  };

  const handleSortChange = (mode) => {
    setSortMode(mode);
  };

  const handleLoadMore = () => {
    if (allBooks.length >= total) return;
    fetchList(page + 1);
  };

  const handleRetry = () => {
    setLoading("loading");
    fetchList(1);
  };

  const getBookTypeTag = (type) => {
    if (String(type) === "2") return { label: "求购", cls: "tag-buy" };
    return { label: "出售", cls: "tag-sell" };
  };

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.switchTab({ url: "/pages/index/index" })}
        />
        <HeadStatus text="书籍" />
      </View>

      {/* 卖书/买书 双按钮 */}
      <View className="trade-btn-row">
        <View
          className="trade-btn trade-btn-sell"
          onClick={() => Taro.navigateTo({ url: "/modules/pages/book/edit/index" })}
        >
          <MaterialCommunityIcons name="book-plus-multiple" size={22} color="#fff" />
          <Text className="trade-btn-text">我要卖书</Text>
        </View>
        <View
          className="trade-btn trade-btn-buy"
          onClick={() => Taro.navigateTo({ url: "/modules/pages/book/buy/index" })}
        >
          <MaterialCommunityIcons name="cart" size={22} color="#fff" />
          <Text className="trade-btn-text">我要买书</Text>
        </View>
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

      {/* 出售/求购/全部 筛选 */}
      <View className="book-type-bar">
        {BOOK_TYPE_OPTIONS.map((opt) => (
          <View
            key={opt.value}
            className={`book-type-tag ${bookType === opt.value ? "book-type-tag-active" : ""}`}
            onClick={() => setBookType(opt.value)}
          >
            <Text>{opt.label}</Text>
          </View>
        ))}
      </View>

      {/* 分割线 */}
      <View className="filter-divider" />

      {/* 种类多选 */}
      <ScrollView scrollX className="category-scroll" enhanced bounces={false}>
        <View className="category-list">
          {categories.map((cat) => (
            <View
              key={cat}
              className={`category-tag ${selectedCats.includes(cat) ? "category-tag-active" : ""}`}
              onClick={() => handleCatToggle(cat)}
            >
              <Text>{cat}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 排序切换栏 */}
      <View className="sort-bar">
        <View className="sort-left">
          <MaterialCommunityIcons name={sortMode === "time" ? "clock" : "fire"} size={18} color="#333" />
          <Text className="sort-label">
            {sortMode === "time" ? "最新书籍" : "最热书籍"}
          </Text>
        </View>
        <View className="sort-right" onClick={() => handleSortChange(sortMode === "time" ? "hot" : "time")}>
          <MaterialCommunityIcons name="swap-vertical" size={16} color="#333" />
          <Text className="sort-toggle-text">
            {sortMode === "time" ? "按时间排序" : "按热度排序"}
          </Text>
        </View>
      </View>

      {/* 列表 */}
      {loading === "loading" && allBooks.length === 0 ? (
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
      ) : loading === "error" && allBooks.length === 0 ? (
        <View className="empty-view" onClick={handleRetry}>
          <Text className="empty-text">加载失败，点击重试</Text>
        </View>
      ) : books.length === 0 && allBooks.length > 0 ? (
        <View className="empty-view">
          <Text className="empty-text">暂无匹配的书籍</Text>
        </View>
      ) : books.length === 0 ? (
        <View className="empty-view">
          <Text className="empty-text">暂无书籍</Text>
        </View>
      ) : (
        <ScrollView
          scrollY
          className="book-grid-scroll"
          onScrollToLower={handleLoadMore}
          lowerThreshold={80}
          enhanced
          bounces={false}
        >
          <View className="book-grid">
            {books.map((book) => {
              const typeTag = getBookTypeTag(book.book_type);
              return (
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
                    {book.images && book.images.length > 0 && !imgErrors[book.id] ? (
                      <Image
                        className="card-img-pic"
                        src={book.images[0].url}
                        mode="aspectFill"
                        onError={() => setImgErrors((prev) => ({ ...prev, [book.id]: true }))}
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
                    {/* 出售/求购标签 */}
                    <View className={`card-type-tag ${typeTag.cls}`}>
                      <Text className="card-type-tag-text">{typeTag.label}</Text>
                    </View>
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
                      {book.isPublisher ? (
                        <Text className="owner-tag">自己</Text>
                      ) : favIds.includes(book.id) ? (
                        <Text className="fav-tag">已收藏</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          {allBooks.length >= total && allBooks.length > 0 && (
            <View className="list-footer">
              <Text className="footer-text">— 已加载全部 —</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB 悬浮按钮 — 消息图标 */}
      <View
        className="fab-btn"
        onClick={() => Taro.navigateTo({ url: "/modules/pages/chat/list/index" })}
      >
        <MaterialCommunityIcons name="message-text-outline" size={40} color="#fff" />
      </View>
    </SafeAreaView>
  );
}
