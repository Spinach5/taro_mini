import { View, Text, ScrollView } from "@tarojs/components";
import Taro, { useLoad, useDidShow } from "@tarojs/taro";
import { useState, useCallback } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import SafeAreaView from "../../../../../components/SafeAreaView";
import HeadStatus from "../../../../../components/HeadStatus";
import { getConversations } from "../../../../../service/hbut/chat";
import { getColorFromName } from "../../../../../utils/getHashCode";
import runtimeLogger from "../../../../../utils/runtimeLogger";
import "./index.css";

export default function Index() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

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
    try {
      const data = await getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      runtimeLogger.error("ChatList", "加载会话列表失败", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useLoad(() => {
    fetchList();
  });

  useDidShow(() => {
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
        <View className="chat-list-page" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
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

      <View className="chat-list-page">
        {conversations.length === 0 ? (
          <View className="chat-empty">
            <Text className="chat-empty-icon">💬</Text>
            <Text className="chat-empty-text">暂无消息</Text>
            <Text className="chat-empty-sub">去书籍广场逛逛吧</Text>
          </View>
        ) : (
          <ScrollView scrollY className="chat-list-scroll" enhanced bounces={false}>
            {conversations.map((conv, idx) => {
              const otherName = conv.otherName || conv.other_name || "?";
              const bookName = conv.bookName || conv.book_name || "";
              return (
                <View key={conv.id || idx}>
                  <View
                    className="chat-item"
                    onClick={() =>
                      Taro.navigateTo({
                        url: `/modules/pages/book/chat/detail/index?conversationId=${conv.id}&name=${encodeURIComponent(otherName)}`,
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
                          {formatTime(conv.lastMessageTime || conv.last_message_time)}
                        </Text>
                      </View>
                      <View className="chat-item-bottom">
                        <Text className="chat-item-last-msg">
                          {(conv.lastMessage || conv.last_message) || "暂无消息"}
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
      </View>
    </SafeAreaView>
  );
}
