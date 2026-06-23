import { View, Text, Image, ScrollView } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import { useState } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import SafeAreaView from "../../../../components/SafeAreaView";
import HeadStatus from "../../../../components/HeadStatus";
import { getBookDetail, toggleWantBook } from "../../../../service";
import { getColorFromName } from "../../../../utils/getHashCode";
import runtimeLogger from "../../../../utils/runtimeLogger";
import "./index.css";

export default function Index() {
  const router = Taro.useRouter();
  const { id } = router.params;

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wantLoading, setWantLoading] = useState(false);

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

  const handleWant = async () => {
    if (wantLoading) return;
    setWantLoading(true);
    try {
      const res = await toggleWantBook(id);
      if (res && res.success) {
        setBook({ ...book, isWanted: res.isWanted });
      }
    } catch (error) {
      Taro.showToast({ title: "操作失败", icon: "none" });
    } finally {
      setWantLoading(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return "";
    return t.slice(0, 10);
  };

  if (loading) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <AtIcon value="arrow-left" color="#ffffff" onClick={() => Taro.navigateBack()} />
          <HeadStatus text="书籍详情" />
        </View>
        <View className="loading-view">
          <AtActivityIndicator isOpened size={32} mode="center" />
        </View>
      </SafeAreaView>
    );
  }

  const images = book.images || [];

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <AtIcon value="arrow-left" color="#ffffff" onClick={() => Taro.navigateBack()} />
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
          </View>
          <Text className="publish-time">发布于 {formatTime(book.publishTime)}</Text>
        </View>

        {/* 书名 */}
        <Text className="book-title">{book.name}</Text>

        {/* 价格 + 配送方式 */}
        <View className="price-condition-row">
          <Text className="book-price">
            <Text className="price-symbol">¥</Text>
            <Text className="price-number">{book.price}</Text>
          </Text>
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
              <Image
                key={idx}
                className="detail-image"
                src={img.url}
                mode="widthFix"
              />
            ))}
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
          className={`want-btn ${book.isWanted ? "want-btn-active" : ""} ${wantLoading ? "want-btn-disabled" : ""}`}
          onClick={handleWant}
        >
          <Text className="want-btn-text">
            {wantLoading ? "..." : book.isWanted ? "已想要" : "想要"}
          </Text>
        </View>
        {book.isPublisher && (
          <View
            className="edit-btn"
            onClick={() =>
              Taro.navigateTo({
                url: `/modules/pages/book/edit/index?id=${id}`,
              })
            }
          >
            <Text className="edit-btn-text">编辑</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
