import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import { useState, useCallback } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import SafeAreaView from "../../../../components/base/SafeAreaView";
import HeadStatus from "../../../../components/layout/HeadStatus";
import { getConversations } from "../../../../service/schools/hbut/chat";
import { getColorFromName } from "../../../../utils/common/getHashCode";
import runtimeLogger from "../../../../utils/common/runtimeLogger";
import "./index.css";

export default function Index() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const formatTime = (t) => {
    if (!t) return "";
    const d = new Date(t);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      runtimeLogger.error("ChatList", "加载会话列表失败", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useLoad(() => {
    fetchList();
  });

  const handleBack = () => {
    const pages = Taro.getCurrentPages();
    pages.length > 1 ? Taro.navigateBack() : Taro.switchTab({ url: "/pages/index/index" });
  };

  if (loading) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <View className="back-btn" onClick={handleBack}>
            <AtIcon value="arrow-left" color="#ffffff" size={20} />
          </View>
          <HeadStatus text="消息" />
        </View>
        <View className="chat-list-loading">
          <AtActivityIndicator isOpened size={32} mode="center" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <View className="uniform-page-header">
        <View className="back-btn" onClick={handleBack}>
          <AtIcon value="arrow-left" color="#ffffff" size={20} />
        </View>
        <HeadStatus text="消息" />
      </View>

      {error ? (
        <View className="chat-error-box">
          <Text className="chat-error-text">加载失败</Text>
          <View className="chat-retry-btn" onClick={fetchList}>
            <Text className="chat-retry-btn-text">重试</Text>
          </View>
        </View>
      ) : conversations.length === 0 ? (
        <View className="chat-empty">
          <Text className="chat-empty-icon">💬</Text>
          <Text className="chat-empty-text">暂无消息</Text>
          <Text className="chat-empty-sub">去书籍广场逛逛吧</Text>
        </View>
      ) : (
        <ScrollView scrollY className="chat-list-scroll" enhanced bounces={false}>
          {conversations.map((conv, idx) => {
            const convId = conv.conversation_id || conv.id;
            const otherName = conv.other_user?.nickName || conv.otherName || conv.other_name || "?";
            const bookName = conv.book_title || conv.bookName || conv.book_name || "";
            const bookImage = conv.book_image || conv.bookImage || "";
            const bookPrice = conv.price || conv.bookPrice || conv.book_price || "";
            const isDelivery = conv.isDelivery || conv.is_delivery || 0;
            const msg = conv.last_message || conv.lastMessage || conv.last_message;
            const msgTime = (msg && typeof msg === "object" ? msg.created_at : "")
              || conv.lastMessageTime || conv.last_message_time
              || conv.updated_at || "";
            return (
              <View key={convId || idx}>
                <View
                  className="chat-item"
                  onClick={() =>
                    Taro.navigateTo({
                      url: `/modules/pages/chat/detail/index?conversationId=${convId}&name=${encodeURIComponent(otherName)}&bookName=${encodeURIComponent(bookName)}&bookImage=${encodeURIComponent(bookImage)}&bookPrice=${encodeURIComponent(bookPrice)}&isDelivery=${isDelivery}`,
                    })
                  }
                >
                  <View className="chat-avatar-wrap">
                    <View
                      className="chat-avatar"
                      style={{ background: getColorFromName(otherName) }}
                    >
                      <Text className="chat-avatar-text">{otherName[0]}</Text>
                    </View>
                    {(conv.unreadCount || conv.unread_count) > 0 && (
                      <View className="chat-unread-badge">
                        <Text className="chat-unread-text">{conv.unreadCount || conv.unread_count}</Text>
                      </View>
                    )}
                  </View>
                  <View className="chat-item-info">
                    <View className="chat-item-top">
                      <View style={{ display: "flex", alignItems: "center" }}>
                        <Text className="chat-item-name">{otherName}</Text>
                        {bookName && (
                          <Text className="chat-item-book-tag">{bookName.length > 6 ? bookName.slice(0, 6) + "..." : bookName}</Text>
                        )}
                      </View>
                      <Text className="chat-item-time">
                        {formatTime(msgTime)}
                      </Text>
                    </View>
                    <View className="chat-item-bottom">
                      <Text className="chat-item-last-msg">
                        {(() => {
                          if (!msg) return "暂无消息";
                          if (typeof msg === "string") return msg;
                          return msg.content || "暂无消息";
                        })()}
                      </Text>
                    </View>
                  </View>
                </View>
                {idx < conversations.length - 1 && <View className="chat-divider" />}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
