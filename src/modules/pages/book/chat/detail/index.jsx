import { View, Text, Input, ScrollView } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import { useState, useCallback, useRef, useEffect } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import SafeAreaView from "../../../../../components/SafeAreaView";
import HeadStatus from "../../../../../components/HeadStatus";
import { getMessages, sendMessage } from "../../../../../service/hbut/chat";
import { getColorFromName } from "../../../../../utils/getHashCode";
import userManager from "../../../../../service/userInfo";
import runtimeLogger from "../../../../../utils/runtimeLogger";
import "./index.css";

const PAGE_SIZE = 20;

export default function Index() {
  const router = Taro.useRouter();
  const conversationId = Number(router.params.conversationId);
  const otherName = decodeURIComponent(router.params.name || "");

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const currentUserId = userManager.getServerUserId();
  const scrollRef = useRef(null);
  const pollingRef = useRef(null);

  const formatTime = (t) => {
    if (!t) return "";
    const d = new Date(t);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const fetchMessages = useCallback(async (p = 1) => {
    try {
      const data = await getMessages(conversationId, p, PAGE_SIZE);
      const list = Array.isArray(data) ? data : [];
      if (p === 1) {
        setMessages(list);
      } else {
        setMessages((prev) => [...list, ...prev]);
      }
      setHasMore(list.length >= PAGE_SIZE);
      setPage(p);
    } catch (error) {
      runtimeLogger.error("ChatDetail", "获取消息失败", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useLoad(() => {
    if (!conversationId) {
      Taro.showToast({ title: "参数错误", icon: "none" });
      Taro.navigateBack();
      return;
    }
    fetchMessages(1);
  });

  // 轮询新消息
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const data = await getMessages(conversationId, 1, PAGE_SIZE);
        const list = Array.isArray(data) ? data : [];
        if (list.length > messages.length) {
          setMessages(list);
          setPage(1);
        }
      } catch {}
    }, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [conversationId, messages.length]);

  // 新消息自动滚到底部
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      setTimeout(() => {
        Taro.pageScrollTo({ scrollTop: 999999, duration: 200 });
      }, 100);
    }
  }, [messages.length, loading]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || sending) return;
    setSending(true);
    setInputValue("");
    try {
      const sent = await sendMessage(conversationId, text);
      const newMsg = sent && sent.data ? sent.data : {
        id: Date.now(),
        content: text,
        sender_id: currentUserId,
        create_time: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      // 滚动到底部
      setTimeout(() => {
        Taro.pageScrollTo({ scrollTop: 999999, duration: 100 });
      }, 150);
    } catch (error) {
      Taro.showToast({ title: "发送失败", icon: "none" });
      setInputValue(text);
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    Taro.navigateBack();
  };

  if (loading) {
    return (
      <SafeAreaView>
        <View className="uniform-page-header">
          <View className="back-btn" onClick={handleBack}>
            <AtIcon value="arrow-left" color="#ffffff" size={20} />
          </View>
          <HeadStatus text={otherName || "聊天"} />
        </View>
        <View className="chat-detail-loading">
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
        <HeadStatus text={otherName || "聊天"} />
      </View>

      <View className="chat-detail-page">
        <ScrollView
          ref={scrollRef}
          scrollY
          className="chat-msg-scroll"
          enhanced
          bounces={false}
          scrollWithAnimation
        >
          {/* 加载更多 */}
          {hasMore && messages.length >= PAGE_SIZE && (
            <View className="chat-loading-more" onClick={() => fetchMessages(page + 1)}>
              <Text className="chat-loading-text">点击加载更多</Text>
            </View>
          )}

          {messages.map((msg, idx) => {
            const isSelf = String(msg.sender_id || msg.senderId) === String(currentUserId);
            const senderName = isSelf ? "我" : (otherName || "对方");

            return (
              <View key={msg.id || idx}>
                <View className="chat-msg-time-bar">
                  <Text className="chat-msg-time-text">
                    {formatTime(msg.create_time || msg.sent_at)}
                  </Text>
                </View>
                <View className={`chat-msg-row ${isSelf ? "msg-self" : "msg-other"}`}>
                  <View
                    className="chat-msg-avatar"
                    style={{ background: getColorFromName(senderName) }}
                  >
                    <Text className="chat-msg-avatar-text">{senderName[0]}</Text>
                  </View>
                  <View className="chat-msg-body">
                    <View className="chat-msg-bubble">
                      <Text>{msg.content}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* 底部输入栏 */}
        <View className="chat-input-bar">
          <Input
            className="chat-input-field"
            type="text"
            placeholder="输入消息..."
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            onConfirm={handleSend}
            confirmType="send"
            maxlength={500}
          />
          <View
            className={`chat-send-btn ${(!inputValue.trim() || sending) ? "chat-send-btn-disabled" : ""}`}
            onClick={handleSend}
          >
            <Text className="chat-send-text">{sending ? "..." : "发送"}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
