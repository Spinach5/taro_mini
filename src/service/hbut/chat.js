// 聊天相关 API
import { serverGet, serverPost } from "../../utils/serverRequest";
import runtimeLogger from "../../utils/runtimeLogger";

/**
 * 发起/获取会话（幂等）
 * @param {number} bookId
 * @returns {Promise<object>}
 */
export async function createConversation(bookId) {
  try {
    return await serverPost("/api/v1/conversations", { book_id: bookId });
  } catch (error) {
    runtimeLogger.error("Chat", "创建会话失败", error);
    throw error;
  }
}

/**
 * 我的会话列表
 * @returns {Promise<Array>}
 */
export async function getConversations() {
  try {
    const res = await serverGet("/api/v1/conversations");
    return (res && res.data) || [];
  } catch (error) {
    runtimeLogger.error("Chat", "获取会话列表失败", error);
    throw error;
  }
}

/**
 * 消息历史（正序分页）
 * @param {number} conversationId
 * @param {number} page
 * @param {number} pageSize
 * @returns {Promise<Array>}
 */
export async function getMessages(conversationId, page = 1, pageSize = 20) {
  try {
    const res = await serverGet(`/api/v1/conversations/${conversationId}/messages`, { page, pageSize });
    return (res && res.data) || [];
  } catch (error) {
    runtimeLogger.error("Chat", "获取消息失败", error);
    throw error;
  }
}

/**
 * 发送消息
 * @param {number} conversationId
 * @param {string} content
 * @returns {Promise<object>}
 */
export async function sendMessage(conversationId, content) {
  try {
    return await serverPost(`/api/v1/conversations/${conversationId}/messages`, { content });
  } catch (error) {
    runtimeLogger.error("Chat", "发送消息失败", error);
    throw error;
  }
}
