import { View, Text, Input, ScrollView, Image } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";
import { useState, useCallback, useRef, useEffect } from "react";
import { AtIcon, AtActivityIndicator } from "taro-ui";
import SafeAreaView from "../../../../components/base/SafeAreaView";
import HeadStatus from "../../../../components/layout/HeadStatus";
import { getMessages, sendMessage } from "../../../../service/schools/hbut/chat";
import { getColorFromName } from "../../../../utils/common/getHashCode";
import userManager from "../../../../service/userInfo";
import runtimeLogger from "../../../../utils/common/runtimeLogger";
import "./index.css";

const PAGE_SIZE = 20;
const DEAL_REQUEST = "__DEAL_REQUEST__";
const DEAL_ACCEPT = "__DEAL_ACCEPT__";

export default function Index() {
  const router = Taro.useRouter();
  const conversationId = Number(router.params.conversationId);
  const otherName = decodeURIComponent(router.params.name || "");
  const bookName = decodeURIComponent(router.params.bookName || "");
  const bookImage = decodeURIComponent(router.params.bookImage || "");
  const bookPrice = decodeURIComponent(router.params.bookPrice || "");
  const isDelivery = Number(router.params.isDelivery || 0);

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

  // 发送成交请求
  const handleMakeDeal = () => {
    Taro.showModal({
      title: "确认成交",
      content: `是否与 ${otherName || "对方"} 就以 ¥${bookPrice || "?"} 成交《${bookName || "书籍"}》？`,
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await sendMessage(conversationId, DEAL_REQUEST);
          setMessages((prev) => [...prev, {
            id: Date.now(),
            content: DEAL_REQUEST,
            sender_id: currentUserId,
            create_time: new Date().toISOString(),
          }]);
        } catch (error) {
          Taro.showToast({ title: "发送失败", icon: "none" });
        }
      },
    });
  };

  // 对方点击同意成交
  const handleAcceptDeal = () => {
    Taro.showModal({
      title: "同意成交",
      content: `确认与对方就以 ¥${bookPrice || "?"} 成交《${bookName || "书籍"}》？`,
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await sendMessage(conversationId, DEAL_ACCEPT);
          setMessages((prev) => [...prev, {
            id: Date.now(),
            content: DEAL_ACCEPT,
            sender_id: currentUserId,
            create_time: new Date().toISOString(),
          }]);
        } catch (error) {
          Taro.showToast({ title: "发送失败", icon: "none" });
        }
      },
    });
  };

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

  // 判断消息是否为成交卡片
  const isDealMsg = (content) => content === DEAL_REQUEST || content === DEAL_ACCEPT;

  const renderMsgBubble = (msg, isSelf) => {
    const content = msg.content || "";
    if (content === DEAL_REQUEST) {
      return (
        <View className={`chat-deal-card ${isSelf ? "chat-deal-card-done" : "chat-deal-card-bg"}`}>
          <Text className="chat-deal-card-icon">{isSelf ? "✅" : "🤝"}</Text>
          <Text className="chat-deal-card-title">
            {isSelf ? "已发送成交请求" : "对方请求成交"}
          </Text>
          {!isSelf && (
            <>
              <Text className="chat-deal-card-desc">点击下方按钮同意成交</Text>
              <View className="chat-deal-card-btn" onClick={(e) => { e.stopPropagation(); handleAcceptDeal(); }}>
                <Text className="chat-deal-card-btn-text">同意成交</Text>
              </View>
            </>
          )}
        </View>
      );
    }
    if (content === DEAL_ACCEPT) {
      return (
        <View className="chat-deal-card chat-deal-card-done">
          <Text className="chat-deal-card-icon">🎉</Text>
          <Text className="chat-deal-card-title">已同意成交</Text>
          <Text className="chat-deal-card-desc">双方已达成交易</Text>
        </View>
      );
    }
    return <Text>{content}</Text>;
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
        {/* 顶部书籍信息栏 */}
        <View className="chat-book-bar">
          {bookImage ? (
            <Image className="chat-book-cover" src={bookImage} mode="aspectFill" />
          ) : (
            <View className="chat-book-cover-placeholder">
              <Text className="chat-book-cover-placeholder-text">暂无</Text>
            </View>
          )}
          <View className="chat-book-info">
            <Text className="chat-book-price">
              <Text style={{ fontSize: "22rpx" }}>¥</Text>
              {bookPrice || "?"}
            </Text>
            <Text className="chat-book-name">书名：{bookName || "未知书籍"}</Text>
            <Text className={`chat-book-delivery ${isDelivery === 1 ? "chat-delivery-send" : ""}`}>
              配送方式：{isDelivery === 1 ? "可送" : "自提"}
            </Text>
          </View>
          <View className="chat-deal-btn" onClick={handleMakeDeal}>
            <Text className="chat-deal-btn-text">成交</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          scrollY
          className="chat-msg-scroll"
          enhanced
          bounces={false}
          scrollWithAnimation
        >
          {hasMore && messages.length >= PAGE_SIZE && (
            <View className="chat-loading-more" onClick={() => fetchMessages(page + 1)}>
              <Text className="chat-loading-text">点击加载更多</Text>
            </View>
          )}

          {messages.map((msg, idx) => {
            const isSelf = String(msg.sender_id || msg.senderId) === String(currentUserId);
            const senderName = isSelf ? "我" : (otherName || "对方");
            const isDeal = isDealMsg(msg.content || "");

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
                    <View className={`chat-msg-bubble ${isDeal ? "chat-deal-card-wrap" : ""}`}>
                      {renderMsgBubble(msg, isSelf)}
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
