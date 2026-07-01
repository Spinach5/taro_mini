import { View, Text, Image, ScrollView } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import { useState } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import SafeAreaView from "../../../../components/base/SafeAreaView";
import HeadStatus from "../../../../components/layout/HeadStatus";
import {
  getBookDetail,
  toggleWantBook,
  addFavoriteBookId,
  removeFavoriteBookId,
  isFavoriteBook,
} from "../../../../service";
import { getColorFromName } from "../../../../utils/common/getHashCode";
import cacheManager from "../../../../utils/common/cache";
import runtimeLogger from "../../../../utils/common/runtimeLogger";
import "./index.css";

export default function Index() {
  const router = Taro.useRouter();
  const { id } = router.params;

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favLoading, setFavLoading] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [imgErrors, setImgErrors] = useState({});

  useLoad(() => {
    if (!id) {
      Taro.showToast({ title: "无效的书籍", icon: "none" });
      Taro.navigateBack();
      return;
    }

    (async () => {
      try {
        const data = await getBookDetail(id);
        if (data) {
          setBook(data);
          setIsFav(isFavoriteBook(Number(id)));
        } else {
          Taro.showToast({ title: "书籍不存在", icon: "none" });
          Taro.navigateBack();
        }
      } catch (error) {
        runtimeLogger.error("BookDetail", "获取书籍详情失败", error);
        Taro.showToast({ title: "加载失败", icon: "none" });
        Taro.navigateBack();
      } finally {
        setLoading(false);
      }
    })();
  });

  const handleFavorite = async () => {
    if (favLoading) return;
    setFavLoading(true);
    try {
      await toggleWantBook(id);
      // 更新本地缓存中的想要数
      const cached = cacheManager.get("v1_books");
      if (cached && Array.isArray(cached.books)) {
        const updated = cached.books.map((b) => {
          if (b.id === Number(id)) {
            const delta = isFav ? -1 : 1;
            return { ...b, wantCount: (b.wantCount || 0) + delta };
          }
          return b;
        });
        cacheManager.set("v1_books", { ...cached, books: updated });
      }
      // 更新收藏状态 + 本地想要数
      const delta = isFav ? -1 : 1;
      setBook({ ...book, wantCount: (book.wantCount || 0) + delta });
      if (isFav) {
        removeFavoriteBookId(Number(id));
        setIsFav(false);
      } else {
        addFavoriteBookId(Number(id));
        setIsFav(true);
      }
    } catch (error) {
      Taro.showToast({ title: "操作失败", icon: "none" });
    } finally {
      setFavLoading(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return "";
    return t.slice(0, 10);
  };

  const goBack = () => {
    const pages = Taro.getCurrentPages();
    if (pages.length > 1) {
      Taro.navigateBack();
    } else {
      Taro.redirectTo({ url: "/modules/pages/book/index" });
    }
  };

  if (loading) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <View className="back-btn" onClick={goBack}>
            <AtIcon value="arrow-left" color="#ffffff" size={20} />
          </View>
          <HeadStatus text="书籍详情" />
        </View>
        <View className="loading-view">
          <AtActivityIndicator isOpened size={32} mode="center" />
        </View>
      </SafeAreaView>
    );
  }

  const images = book.images || [];
  const isBuy = String(book.book_type) === "2";

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <View className="back-btn" onClick={goBack}>
          <AtIcon value="arrow-left" color="#ffffff" size={20} />
        </View>
        <HeadStatus text="书籍详情" />
      </View>

      <ScrollView scrollY className="detail-scroll" enhanced bounces={false}>
        {/* 发布者信息 */}
        <View className="publisher-bar">
          <View className="publisher-info">
            <View
              className="publisher-avatar"
              style={{ background: getColorFromName(book.publisherName || "?") }}
            >
              <Text className="publisher-avatar-text">
                {(book.publisherName || "?")[0]}
              </Text>
            </View>
            <Text className="publisher-name">{book.publisherName || "未知"}</Text>
            <Text className={`detail-type-tag ${isBuy ? "detail-type-buy" : "detail-type-sell"}`}>
              {isBuy ? "求购" : "出售"}
            </Text>
          </View>
          <Text className="publish-time">发布于 {formatTime(book.publishTime)}</Text>
        </View>

        {/* 书名 + 状态 */}
        <View className="book-title-row">
          <Text className="book-title">{book.name}</Text>
          {book.status != null && (
            <Text className="publish-status">
              交易状态：{book.status === 0 ? "发布中" : book.status === 1 ? "交易中" : book.status === 2 ? "已下架" : "未知"}
            </Text>
          )}
        </View>

        {/* 价格 + 配送方式 */}
        <View className="price-condition-row">
          <View className="price-left">
            <Text className="price-label">{isBuy ? "期望价格" : "预估售价"}</Text>
            <Text className="book-price">
              <Text className="price-symbol">¥</Text>
              <Text className="price-number">{book.price}</Text>
            </Text>
            <Text className="want-count-text">
              {isBuy ? `${book.wantCount || 0}人想卖` : `${book.wantCount || 0}人想要`}
            </Text>
          </View>
          <Text className={`delivery-badge ${book.isDelivery === 1 ? "delivery-send" : "delivery-pickup"}`}>
            {book.isDelivery === 1 ? "可送" : "自提"}
          </Text>
        </View>

        {/* 描述 */}
        {book.description ? (
          <Text className="book-description">{book.description}</Text>
        ) : null}

        {/* 属性横向滑动条 */}
        <View className="info-slider">
          <ScrollView scrollX className="info-scroll" enhanced bounces={false}>
            <View className="info-scroll-inner">
              <View className="info-item">
                <Text className="info-label">种类</Text>
                <Text className="info-value">{book.category || "未分类"}</Text>
              </View>
              <View className="info-divider" />
              <View className="info-item">
                <Text className="info-label">成色</Text>
                <Text className="info-value">{book.condition || "未知"}</Text>
              </View>
              <View className="info-divider" />
              <View className="info-item">
                <Text className="info-label">作者</Text>
                <Text className="info-value">{book.author || "无"}</Text>
              </View>
              <View className="info-divider" />
              <View className="info-item">
                <Text className="info-label">出版社</Text>
                <Text className="info-value">{book.publisher || "无"}</Text>
              </View>
              <View className="info-divider" />
              <View className="info-item">
                <Text className="info-label">ISBN</Text>
                <Text className="info-value">{book.isbn || "暂无"}</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* 书籍图片 */}
        {images.length > 0 ? (
          <View className="detail-images">
            {images.map((img, idx) => (
              imgErrors[idx] ? null : (
                <Image
                  key={idx}
                  className="detail-image"
                  src={img.url}
                  mode="widthFix"
                  onError={() => setImgErrors((prev) => ({ ...prev, [idx]: true }))}
                />
              )
            ))}
            {Object.keys(imgErrors).length >= images.length && (
              <View className="detail-images-empty">
                <Text className="images-empty-text">图片加载失败</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="detail-images-empty">
            <Text className="images-empty-text">暂无图片</Text>
          </View>
        )}

        {/* 底部留白 */}
        <View style={{ height: "120rpx" }} />
      </ScrollView>

      {/* 底部固定栏 */}
      <View className="bottom-bar">
        <View
          className={`fav-btn ${isFav ? "fav-btn-active" : ""} ${favLoading ? "fav-btn-disabled" : ""}`}
          onClick={handleFavorite}
        >
          <AtIcon value={isFav ? "heart-2" : "heart"} size={22} color={isFav ? "#e74c3c" : "#000"} />
          <Text className="fav-text">{isFav ? "已收藏" : "收藏"}</Text>
        </View>

      </View>
    </SafeAreaView>
  );
}
