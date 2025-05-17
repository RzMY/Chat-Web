// API基础配置
const API_BASE_URL = 'https://10.0.0.2:8887/api'; // 根据实际后端地址修改

// API请求路径
export const API = {
  faceDetect: `${API_BASE_URL}/faceDetect/`,
  faceCollect: `${API_BASE_URL}/faceCollect/`,
  sendMessage: `${API_BASE_URL}/sendMessageOllama/`,
  // streamMessage: `${API_BASE_URL}/streamMessage/`,
  streamMessage: `${API_BASE_URL}/streamMessageOllama/`,
  getUserInfo: `${API_BASE_URL}/getUserInfo/`,
  
  // 聊天记录相关API
  getConversations: `${API_BASE_URL}/conversations/`,
  getConversationMessages: (id) => `${API_BASE_URL}/conversations/${id}/messages/`,
  createConversation: `${API_BASE_URL}/conversations/create/`,
  saveMessage: `${API_BASE_URL}/conversations/message/save/`,
  updateConversationTitle: (id) => `${API_BASE_URL}/conversations/${id}/update-title/`,
  deleteConversation: (id) => `${API_BASE_URL}/conversations/${id}/delete/`,
};

// 导出统一的请求方法
export async function apiRequest(url, options = {}) {
  // 添加认证头
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    return await response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}