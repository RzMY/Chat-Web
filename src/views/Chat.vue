<script setup>
import { ref, reactive, onMounted, nextTick, computed, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import ChatSidebar from '../components/ChatSidebar.vue';
import CodeBlock from '../components/CodeBlock.vue';
import { useUserStore, useChatStore } from '../store';
import { API, apiRequest } from '../utils/api';
import showdown from 'showdown';

const router = useRouter();
const userStore = useUserStore();
const chatStore = useChatStore();
const messageInput = ref('');
const loading = ref(false);
const messageContainer = ref(null);
const aiMessage = ref(null);
const userScrolling = ref(false);

const debugScrollInfo = () => {
  if (!messageContainer.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = messageContainer.value;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  
  console.log('Scroll Debug:', {
    distanceFromBottom,
    isUserScrolling: userScrolling.value,
    isLoading: loading.value,
    containerHeight: clientHeight,
    totalHeight: scrollHeight
  });
};

// 使用用户store获取用户信息
console.log('userStore', userStore.userInfo);
const userInfo = computed(() => userStore.userInfo || {
  name: '访客用户',
  avatar: '/src/assets/default-avatar.png'
});

// 从聊天store获取会话数据
const conversations = computed(() => chatStore.conversations);
const currentConversationId = computed(() => chatStore.currentConversationId);

const showThinking = ref(false);
const thinkingContent = ref('');

// 转换markdown到HTML
const converter = new showdown.Converter({
  simpleLine: true,
  tables: true,
  tasklists: true,
  strikethrough: true,
  smartIndentationFix: true, // 添加此选项修复缩进
  simpleLineBreaks: true,    // 简单换行
  openLinksInNewWindow: true // 链接在新窗口打开
});

const throttle = (fn, delay) => {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
};

// 使用节流函数包装滚动函数
const throttledScrollToBottom = throttle(async () => {
  await nextTick();
  if (messageContainer.value) {
    // 平滑滚动
    messageContainer.value.scrollTo({
      top: messageContainer.value.scrollHeight,
      behavior: 'smooth'
    });
  }
}, 100); // 每100ms最多执行一次

// 替换原来的滚动函数，保留原函数以便在必要时（如发送消息后）立即滚动
const scrollToBottom = async () => {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

// 智能滚动 - 只有当用户已经在底部附近时才自动滚动
const smartScroll = async () => {
  await nextTick();
  if (!messageContainer.value || userScrolling.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = messageContainer.value;
  if (scrollHeight - scrollTop - clientHeight < 200) {
    throttledScrollToBottom();
  }
};

const parseThinkingContent = (message) => {
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
};

// 当前会话的消息
const messages = computed(() => {
  // 获取原始消息数据
  const originalMessages = chatStore.getCurrentMessages();
  
  // 处理每条消息，提取思考内容
  return originalMessages.map(message => parseThinkingContent(message));
});

onMounted(async () => {
  // 检查认证状态
  if (!userStore.isAuthenticated && !userStore.checkAuth()) {
    router.push('/login');
    return;
  }
  
  // 如果有token但没有用户信息，尝试从后端获取
  if (userStore.isAuthenticated && !userStore.userInfo) {
    try {
      const response = await apiRequest(API.getUserInfo);
      if (response.code === 200 && response.userInfo) {
        userStore.setUser(response.userInfo);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  }
  
  // 加载会话列表
  await chatStore.loadConversations();
  
  // 如果没有当前会话，创建一个新会话
  if (!currentConversationId.value) {
    createNewChat();
  }

  if (messageContainer.value) {
    messageContainer.value.addEventListener('scroll', handleScroll);
  }
});

onBeforeUnmount(() => {
  if (messageContainer.value) {
    messageContainer.value.removeEventListener('scroll', handleScroll);
  }
});

const handleScroll = () => {
  if (!messageContainer.value) return;
  
  const { scrollTop, scrollHeight, clientHeight } = messageContainer.value;
  // 如果用户向上滚动超过100px，标记为正在查看历史
  userScrolling.value = scrollHeight - scrollTop - clientHeight > 100;
};

// 创建新会话
const createNewChat = () => {
  chatStore.createConversation();
};

// 发送消息
const sendMessage = async () => {
  if (!messageInput.value.trim() || loading.value) return;
  
  const userMessage = messageInput.value;
  messageInput.value = '';
  
  // 创建用户消息对象
  const userMessageObj = {
    id: Date.now(),
    role: 'user',
    content: userMessage,
    time: new Date().toLocaleTimeString()
  };
  
  // 添加用户消息到store
  await chatStore.addMessage(currentConversationId.value, userMessageObj);
  
  // 更新当前会话的标题
  if (messages.value.length === 1) {
    await chatStore.updateConversationTitle(
      currentConversationId.value, 
      userMessage.slice(0, 20) + (userMessage.length > 20 ? '...' : '')
    );
  }
  
  // 滚动到底部
  await scrollToBottom();
  
  // 显示加载状态
  loading.value = true;
  
  // 创建AI回复的消息对象
  aiMessage.value = {
    id: Date.now(),
    role: 'assistant',
    content: '',
    time: new Date().toLocaleTimeString(),
    thinking: false // 用于标记是否正在显示思考内容
  };
  
  // 先添加到store
  await chatStore.addMessage(currentConversationId.value, aiMessage.value);

  try {
    // 获取 JWT token
    const token = localStorage.getItem('token');
    
    // 使用POST请求并将数据放在请求体中
    const response = await fetch(API.streamMessage, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        conversationId: currentConversationId.value,
        message: userMessage,
        userMessageId: userMessageObj.id,
        userMessageTime: userMessageObj.time
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let isThinking = false;
    let thinkingText = '';
    let responseText = '';
    
    // 处理流式响应
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // 流结束时，强制滚动到底部
        loading.value = false;
        aiMessage.value.thinking = false;
        
        // 使用原始即时滚动，确保消息结束时视图移到底部
        await scrollToBottom();
        break;
      }
    
      // 解码接收到的块并处理
      const chunk = decoder.decode(value, { stream: true });
      
      // 分割事件流
      const lines = chunk.split('\n\n');
      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data:')) continue;
        
        try {
          const data = JSON.parse(line.substring(5).trim());
          
          if (data.done) {
            // 完成处理
            loading.value = false;
            aiMessage.value.thinking = false;
            await scrollToBottom();
            continue;
          }
          
          if (data.text) {
            let chunkText = data.text;
            
            // 检查是否包含思考内容
            if (chunkText.includes('<think>') && !isThinking) {
              isThinking = true;
              aiMessage.value.thinking = true;
              chunkText = chunkText.replace('<think>', '');
            }
            
            if (isThinking) {
              if (chunkText.includes('</think>')) {
                // 思考结束，切换到正文
                isThinking = false;
                const parts = chunkText.split('</think>');
                
                // 将剩余的思考部分添加到 thinkingText
                if (parts[0]) {
                  thinkingText += parts[0];
                }
                
                // 将正文部分添加到 responseText
                if (parts.length > 1 && parts[1]) {
                  responseText += parts[1];
                }
                
                // 更新消息内容 - 确保关闭思考状态
                aiMessage.value.thinking = false;
                aiMessage.value.content = responseText;
                aiMessage.value.thinkingContent = thinkingText;

                console.log("思考结束，切换到正文");
              } else {
                // 仍在思考中
                thinkingText += chunkText;
                aiMessage.value.thinkingContent = thinkingText;
              }
            } else {
              // 处理正常的响应文本 - 直接应用，实现真正的流式效果
              responseText += chunkText;
              aiMessage.value.content = responseText;
            }
          }
          
          // 每收到一块数据就滚动到底部
          await smartScroll();
        } catch (parseError) {
          console.error('解析事件数据错误:', parseError, line);
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    
    // 添加错误信息
    aiMessage.content = '连接错误，请稍后再试';
    aiMessage.error = true;
    aiMessage.thinking = false;
    
    loading.value = false;
    await scrollToBottom();
  }
};

const enhanceListFormatting = (html) => {
  // 第一步：修复嵌套序号问题
  html = html.replace(/<ol>\s*<li>\s*<ol>/g, '<ol><li style="list-style-type: none;"><ol>')
             .replace(/<ul>\s*<li>\s*<ul>/g, '<ul><li style="list-style-type: none;"><ul>')
             .replace(/<ol>\s*<li>\s*<ul>/g, '<ol><li style="list-style-type: none;"><ul>')
             .replace(/<ul>\s*<li>\s*<ol>/g, '<ul><li style="list-style-type: none;"><ol>');
  
  // 第二步：给列表项添加特殊类，以便CSS可以精确控制
  html = html.replace(/<li>/g, '<li class="md-list-item">');
  
  // 第三步：使用计数器修复顺序列表
  // 查找所有有序列表
  const olRegex = /<ol>[\s\S]*?<\/ol>/g;
  html = html.replace(olRegex, function(match) {
    // 在每个<li>元素前添加编号索引属性
    let count = 0;
    return match.replace(/<li class="md-list-item">/g, function() {
      count++;
      return `<li class="md-list-item" data-index="${count}">`;
    });
  });
  
  return html;
};

const parseMessage = (content) => {
  // 配置showdown以更好地处理各种元素
  converter.setOption('ghCodeBlocks', true);
  converter.setOption('smoothLivePreview', true);
  converter.setOption('smartIndentationFix', true);
  converter.setOption('disableForced4SpacesIndentedSublists', false);
  converter.setOption('simpleLineBreaks', true); 
  converter.setOption('requireSpaceBeforeHeadingText', true);
  
  // 将markdown转换为HTML
  let html = converter.makeHtml(content);
  
  // 处理代码块
  html = html.replace(/<pre><code class="([^"]+)">([\s\S]*?)<\/code><\/pre>/g, (match, language, code) => {
    const lang = language.replace('language-', '');
    return `<div class="code-block"><div class="code-header"><span>${lang}</span><button class="copy-btn">复制代码</button></div><pre><code class="${language}">${code}</code></pre></div>`;
  });
  
  // 增强列表处理
  html = enhanceListFormatting(html);

  return html;
};

const processMessageHtml = (html) => {
  // 在nextTick中添加复制代码按钮的事件和修复列表编号
  nextTick(() => {
    // 处理代码复制按钮
    document.querySelectorAll('.copy-btn').forEach(btn => {
      if (!btn.hasListener) {
        btn.hasListener = true;
        btn.addEventListener('click', () => {
          const code = btn.parentElement.nextElementSibling.textContent;
          navigator.clipboard.writeText(code);
          const originalText = btn.textContent;
          btn.textContent = '已复制!';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        });
      }
    });
    
    // 修复有序列表编号
    fixOrderedLists();
  });
  return html;
};

// 修复有序列表编号的DOM操作
const fixOrderedLists = () => {
  document.querySelectorAll('ol').forEach(ol => {
    // 为每个ol元素添加自定义计数器
    const listItems = ol.querySelectorAll(':scope > li');
    listItems.forEach((item, index) => {
      // 使用data属性存储实际序号
      item.setAttribute('data-counter', index + 1);
    });
  });
};

// 选择会话
const selectConversation = (id) => {
  chatStore.setCurrentConversation(id);
};

// 添加重命名会话方法
const renameConversation = async (id, newTitle) => {
  await chatStore.updateConversationTitle(id, newTitle);
};

// 添加删除会话方法
const deleteConversation = async (id) => {
  await chatStore.deleteConversation(id);
};

// 退出登录
const handleLogout = () => {
  userStore.logout();
  router.push('/login');
};

</script>

<template>
  <div class="chat-container">
    <ChatSidebar 
      :conversations="conversations"
      :currentConversationId="currentConversationId"
      :userInfo="userInfo"
      @select-conversation="selectConversation"
      @new-chat="createNewChat"
      @logout="handleLogout"
      @rename-conversation="renameConversation"
      @delete-conversation="deleteConversation"
    />
    
    <div class="chat-main">
      <div class="message-container" ref="messageContainer">
        <div class="welcome-message" v-if="messages.length === 0">
          <h1>AI聊天助手</h1>
          <p>有什么可以帮助您的？</p>
        </div>
        
        <div 
          v-for="message in messages" 
          :key="message.id" 
          class="message" 
          :class="message.role"
        >
          <div class="message-avatar">
            <img 
              :src="message.role === 'user' ? userInfo.avatar : '/src/assets/ai-avatar.png'" 
              alt="Avatar" 
            />
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-name">{{ message.role === 'user' ? userInfo.name : 'AI助手' }}</span>
              <span class="message-time">{{ message.time }}</span>
            </div>
            
            <!-- 显示思考内容 -->
            <div class="thinking-content" v-if="message.thinkingContent">
              <div class="thinking-header">
                <div class="thinking-indicator" v-if="isThinking">
                  <span></span><span></span><span></span>
                </div>
                <span>思考过程</span>
              </div>
              <pre>{{ message.thinkingContent }}</pre>
            </div>
            
            <!-- 显示消息主体 -->
            <div class="message-body" 
                v-html="processMessageHtml(parseMessage(message.content))"
                :class="{ 'typing': loading && aiMessage && message.id === aiMessage.id }">
            </div>
          </div>
        </div>
      </div>
      
      <div class="input-container">
        <div class="input-wrapper">
          <textarea 
            v-model="messageInput" 
            placeholder="输入您的问题..." 
            @keydown.enter.prevent="sendMessage"
            :disabled="loading"
            rows="1"
          ></textarea>
          <button @click="sendMessage" :disabled="loading" class="send-button">
            {{ loading ? '请稍候...' : '发送' }}
          </button>
        </div>
        <div class="input-tip">按 Enter 发送</div>
      </div>
    </div>
  </div>
  <div 
    class="scroll-to-bottom" 
    :class="{ visible: userScrolling }"
    @click="scrollToBottom"
  >
    ↓
  </div>
</template>

<style scoped>
.message-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  scroll-behavior: smooth; /* 使用平滑滚动 */
  overscroll-behavior: contain; /* 防止滚动穿透 */
  will-change: scroll-position; /* 提高滚动性能 */
}

.scroll-to-bottom {
  position: absolute;
  bottom: 80px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 10;
}

.scroll-to-bottom.visible {
  opacity: 1;
}

.welcome-message {
  text-align: center;
  padding: 80px 20px;
  color: #444;
}

.welcome-message h1 {
  font-size: 32px;
  margin-bottom: 16px;
  font-weight: 600;
}

.message {
  display: flex;
  margin-bottom: 24px;
  max-width: 90%;
  transition: all 0.2s ease-out;
}

.message.user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 15px;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  max-width: calc(100% - 70px);
}

.message.user .message-content {
  background-color: #dcf8c6;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.message-name {
  font-weight: 600;
  color: #333;
}

.message-time {
  color: #999;
  font-size: 12px;
}

.message-body.thinking {
  font-family: monospace;
  color: #555;
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 5px;
}

.input-container {
  padding: 20px;
  border-top: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

textarea {
  width: 100%;
  padding: 12px 70px 12px 15px; /* 增加右侧padding为按钮留出更多空间 */
  border: 1px solid #d9d9e3;
  border-radius: 6px;
  font-size: 16px;
  resize: none;
  background-color: white;
  transition: height 0.2s;
  min-height: 50px;
  max-height: 200px;
  box-sizing: border-box; /* 确保padding包含在宽度内 */
}

textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.send-button {
  position: absolute;
  right: 10px; /* 距离右边界更近 */
  top: 50%;
  transform: translateY(-50%); /* 垂直居中 */
  padding: 6px 15px;
  width: auto;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.send-button:hover {
  background-color: #2980b9;
}

.send-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}
.input-tip {
  font-size: 12px;
  color: #999;
  text-align: right;
  margin-top: 5px;
}

:deep(code:not(pre code)) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 3px 5px;
  border-radius: 3px;
  font-family: monospace;
}

:deep(a) {
  color: #3498db;
  text-decoration: none;
}

:deep(a:hover) {
  text-decoration: underline;
}

:deep(ul, ol) {
  margin: 10px 0;
  padding-left: 25px;
}

:deep(li) {
  margin: 5px 0;
}

.thinking-process {
  opacity: 0.8;
}

/* 改进代码块样式 */
:deep(.code-block) {
  margin: 15px 0;
  border-radius: 6px;
  overflow: hidden;
}

:deep(.code-header) {
  display: flex;
  justify-content: space-between;
  padding: 8px 15px;
  background-color: #343541;
  color: #abb2bf;
}

:deep(.copy-btn) {
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  color: #abb2bf;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

:deep(.copy-btn:hover) {
  background-color: rgba(255, 255, 255, 0.2);
}

@keyframes thinking {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.thinking-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: #3498db;
  font-size: 0.85em;
}

.thinking-indicator {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.thinking-indicator span {
  display: inline-block;
  width: 6px; /* 稍微小一点 */
  height: 6px;
  margin-right: 3px;
  background-color: #3498db;
  border-radius: 50%;
  animation: thinking 1.4s infinite ease-in-out both;
}

.thinking-indicator span:nth-child(1) { 
  animation-delay: -0.32s; 
}

.thinking-indicator span:nth-child(2) { 
  animation-delay: -0.16s; 
}

/* 确保代码块正确显示 */
:deep(pre) {
  background-color: #282c34;
  color: #abb2bf;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
  max-width: 100%;
  white-space: pre-wrap;
}

/* 确保文本正确对齐 */
.message-body {
  color: #333;
  line-height: 1.5;
  text-align: left;
  word-break: break-word;
}

/* 确保聊天容器铺满屏幕 */
.chat-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #f7f7f8;
}

/* 确保主聊天区域响应式适配 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  background-color: #f7f7f8;
}

.message-body.typing::after {
  content: '|';
  display: inline-block;
  animation: blink 0.7s infinite;
  margin-left: 1px;
  font-weight: bold;
  color: #333;
}

@keyframes blink {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

.thinking-content {
  font-family: monospace;
  white-space: pre-wrap;
  background-color: #f4f4f6;
  padding: 15px;
  border-radius: 6px;
  border-left: 3px solid #3498db;
  margin-bottom: 15px;
  font-size: 0.9em;
  color: #666;
  overflow-x: auto;
}

/* 修复消息内容溢出问题 */
.message-content {
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  max-width: calc(100% - 70px);
  overflow-wrap: break-word; /* 确保长文本会换行 */
  word-break: break-word;    /* 允许在单词内换行 */
}

/* 确保消息体有适当的宽度控制 */
.message-body {
  color: #333;
  line-height: 1.5;
  text-align: left;
  word-break: break-word;
  overflow-wrap: break-word;
  width: 100%;            /* 确保宽度不超过父容器 */
  box-sizing: border-box; /* 包含padding和border在宽度内 */
}

/* 修复超出左边界的问题 */
@media (max-width: 768px) {
  .message-content {
    max-width: calc(100% - 50px); /* 小屏幕时减小内容区宽度 */
  }
  
  :deep(ol), :deep(ul) {
    padding-left: 20px; /* 小屏幕减小缩进 */
  }
}

:deep(ol) {
  list-style-type: none; /* 移除默认样式 */
  counter-reset: item;   /* 重置计数器 */
  padding-left: 30px;    /* 增加左侧缩进 */
  margin: 12px 0;
}

:deep(ol > li) {
  counter-increment: item; /* 增加计数器 */
  position: relative;      /* 相对定位 */
  display: block;
}

:deep(ol > li::before) {
  content: counter(item) "."; /* 显示编号 */
  position: absolute;
  left: -25px;
  width: 20px;
  text-align: right;
  color: #666;
}

/* 嵌套有序列表的计数器 */
:deep(ol ol) {
  counter-reset: subitem; /* 重置子列表计数器 */
}

:deep(ol ol > li) {
  counter-increment: subitem; /* 增加子列表计数器 */
}

:deep(ol ol > li::before) {
  content: counter(subitem) "."; /* 显示子列表编号 */
}

/* 处理多级嵌套 */
:deep(ol ol ol) {
  counter-reset: subsubitem;
}

:deep(ol ol ol > li) {
  counter-increment: subsubitem;
}

:deep(ol ol ol > li::before) {
  content: counter(subsubitem) ".";
}

/* 确保无序列表的样式正确 */
:deep(ul) {
  list-style-type: disc; /* 实心圆点 */
  padding-left: 30px;
  margin: 12px 0;
}

:deep(ul ul) {
  list-style-type: circle; /* 二级列表用空心圆点 */
}

:deep(ul ul ul) {
  list-style-type: square; /* 三级列表用方块 */
}

/* 确保列表项与序号对齐 */
:deep(.md-list-item) {
  margin: 5px 0;
  padding-left: 5px;
}
</style>