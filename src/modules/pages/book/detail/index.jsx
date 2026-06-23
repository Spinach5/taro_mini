import { View, Text, Image, Swiper, SwiperItem } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import { useState } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import SafeAreaView from "../../../../components/SafeAreaView";
import HeadStatus from "../../../../components/HeadStatus";
import { getBookDetail, toggleWantBook } from "../../../../service";
import runtimeLogger from "../../../../utils/runtimeLogger";
import "./index.css";

const CONDITION_COLORS = {
  全新: "#27ae60",
  几乎全新: "#3498db",
  有笔记: "#f39c12",
  较旧: "#95a5a6",
};

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

  if (loading) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <AtIcon
            value="arrow-left"
            color="#ffffff"
            onClick={() => Taro.navigateBack()}
          />
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
        <AtIcon
          value="arrow-left"
          color="#ffffff"
          onClick={() => Taro.navigateBack()}
        />
        <HeadStatus text="书籍详情" />
      </View>

      <View className="detail-scroll">
        {/* 轮播图 */}
        {images.length > 0 ? (
          <Swiper
            className="detail-swiper"
            indicatorDots
            indicatorColor="rgba(255,255,255,0.5)"
            indicatorActiveColor="#fff"
            circular
          >
            {images.map((img, idx) => (
              <SwiperItem key={idx}>
                <Image
                  className="swiper-img"
                  src={img.url}
                  mode="aspectFill"
                />
              </SwiperItem>
            ))}
          </Swiper>
        ) : (
          <View className="detail-swiper detail-swiper-empty">
            <Text className="swiper-empty-text">暂无图片</Text>
          </View>
        )}

        {/* 信息区 */}
        <View className="detail-section">
          <Text className="detail-name">{book.name}</Text>
          <Text className="detail-price">¥{book.price}</Text>
        </View>

        <View className="detail-section">
          <View className="detail-row">
            <Text className="detail-label">ISBN</Text>
            <Text className="detail-value">{book.isbn || "暂无"}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">类别</Text>
            <Text className="detail-value">{book.category || "未分类"}</Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">发布人</Text>
            <Text className="detail-value">
              {book.publisherName || "未知"}
            </Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">发布时间</Text>
            <Text className="detail-value">
              {book.publishTime || "未知"}
            </Text>
          </View>
          <View className="detail-row">
            <Text className="detail-label">新旧程度</Text>
            <Text
              className="condition-tag"
              style={{
                background: CONDITION_COLORS[book.condition] || "#95a5a6",
              }}
            >
              {book.condition || "未知"}
            </Text>
          </View>
        </View>

        {book.description ? (
          <View className="detail-section">
            <Text className="detail-section-title">描述</Text>
            <Text className="detail-section-content">{book.description}</Text>
          </View>
        ) : null}

        {/* 底部留白给固定栏 */}
        <View style={{ height: "120rpx" }} />
      </View>

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
