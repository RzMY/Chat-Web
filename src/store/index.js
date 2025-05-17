import { defineStore } from 'pinia'
import { API, apiRequest } from '../utils/api'

// 用户信息存储
export const useUserStore = defineStore('user', {
  state: () => ({
    isAuthenticated: false,
    userInfo: null,
    token: null
  }),
  actions: {
    setUser(userInfo) {
      this.userInfo = userInfo
      this.isAuthenticated = true
    },
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },
    logout() {
      this.userInfo = null
      this.isAuthenticated = false
      this.token = null
      localStorage.removeItem('token')
    },
    checkAuth() {
      const token = localStorage.getItem('token')
      if (token) {
        this.token = token
        this.isAuthenticated = true
        return true
      }
      return false
    }
  },
  // 添加持久化配置
  persist: {
    enabled: true,
    strategies: [
      { 
        key: 'user-info',
        storage: localStorage,
        paths: ['userInfo', 'isAuthenticated', 'token'] // 指定需要持久化的字段
      }
    ]
  }
})

// 聊天记录存储
export const useChatStore = defineStore('chat', {
  state: () => ({
    conversations: [],
    currentConversationId: null,
    isLoading: false,
    syncError: null
  }),
  actions: {
    async loadConversations() {
      this.isLoading = true
      try {
        const response = await apiRequest(API.getConversations)
        if (response.code === 200) {
          this.conversations = response.conversations
          
          // 如果有会话，选择第一个作为当前会话
          if (this.conversations.length > 0 && !this.currentConversationId) {
            this.currentConversationId = this.conversations[0].id
            // 加载当前会话的消息
            await this.loadConversationMessages(this.currentConversationId)
          }
        } else {
          this.syncError = response.msg || '加载会话失败'
        }
      } catch (error) {
        console.error('加载会话错误:', error)
        this.syncError = '网络错误，请稍后再试'
      } finally {
        this.isLoading = false
      }
    },
    
    async loadConversationMessages(conversationId) {
      if (!conversationId) return;
      
      this.isLoading = true;
      try {
        const response = await apiRequest(API.getConversationMessages(conversationId));
        if (response.code === 200) {
          // 找到会话并更新消息
          const conversation = this.conversations.find(c => c.id === conversationId);
          if (conversation) {
            // 在这里处理每条消息
            if (response.messages && Array.isArray(response.messages)) {
              conversation.messages = response.messages.map(message => {
                // 调用App.vue中定义的解析函数（稍后会将此逻辑移到store中）
                return this.parseThinkingContent ? this.parseThinkingContent(message) : message;
              });
            } else {
              conversation.messages = response.messages || [];
            }
          }
        } else {
          this.syncError = response.msg || '加载消息失败';
        }
      } catch (error) {
        console.error('加载消息错误:', error);
        this.syncError = '网络错误，请稍后再试';
      } finally {
        this.isLoading = false;
      }
    },

    parseThinkingContent(message) {
      if (!message.content || typeof message.content !== 'string') return message;
      
      // 复制一个新对象，避免直接修改原始对象
      const processedMessage = { ...message };
      
      // 检查是否包含思考标记
      if (message.content.includes('<think>') && message.content.includes('</think>')) {
        const parts = message.content.split('<think>');
        const beforeThinking = parts[0]; // 思考前的内容
        
        const thinkingAndAfter = parts[1].split('</think>');
        const thinkingContent = thinkingAndAfter[0]; // 思考内容
        const afterThinking = thinkingAndAfter[1] || ''; // 思考后的内容
        
        // 设置思考内容
        processedMessage.thinkingContent = thinkingContent;
        
        // 设置正常内容（思考前+思考后的内容）
        processedMessage.content = beforeThinking + afterThinking;
      }
      
      return processedMessage;
    },
    
    async createConversation(title = '新对话') {
      const id = 'chat_' + Date.now()
      const newChat = {
        id,
        title,
        date: new Date().toLocaleDateString(),
        messages: []
      }
      
      // 先更新本地状态
      this.conversations.unshift(newChat)
      this.currentConversationId = id
      
      // 然后同步到后端
      try {
        await apiRequest(API.createConversation, {
          method: 'POST',
          body: JSON.stringify({
            id,
            title
          })
        })
      } catch (error) {
        console.error('创建会话错误:', error)
      }
      
      return id
    },
    
    async addMessage(conversationId, message) {
      const conversation = this.conversations.find(c => c.id === conversationId)
      if (conversation) {
        conversation.messages.push(message)
      }
    },
    
    async updateConversationTitle(id, title) {
      // 先更新本地状态
      const conversation = this.conversations.find(c => c.id === id)
      if (conversation) {
        conversation.title = title
      }
      
      // 然后同步到后端
      try {
        await apiRequest(API.updateConversationTitle(id), {
          method: 'PUT',
          body: JSON.stringify({ title })
        })
      } catch (error) {
        console.error('更新会话标题错误:', error)
      }
    },
    
    async deleteConversation(id) {
      // 先更新本地状态
      const index = this.conversations.findIndex(c => c.id === id)
      if (index !== -1) {
        this.conversations.splice(index, 1)
        if (this.currentConversationId === id) {
          this.currentConversationId = this.conversations.length > 0 ? this.conversations[0].id : null
        }
      }
      
      // 然后同步到后端
      try {
        await apiRequest(API.deleteConversation(id), {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('删除会话错误:', error)
      }
    },
    
    setCurrentConversation(id) {
      this.currentConversationId = id
      // 如果已切换会话，加载该会话的消息
      this.loadConversationMessages(id)
    },
    
    getCurrentMessages() {
      const conversation = this.conversations.find(c => c.id === this.currentConversationId)
      return conversation ? conversation.messages : []
    }
  },
  persist: {
    enabled: true,
    strategies: [
      { 
        key: 'chat-history',
        storage: localStorage
      }
    ]
  }
})