<script setup>
import { ref, watch, nextTick, onMounted } from 'vue';
import CodeBlock from './CodeBlock.vue';
import showdown from 'showdown';

const props = defineProps({
  messages: {
    type: Array,
    default: () => []
  },
  userInfo: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  thinking: {
    type: Boolean,
    default: false
  },
  thinkingContent: {
    type: String,
    default: ''
  }
});

const messageContainer = ref(null);

// 转换markdown到HTML
const converter = new showdown.Converter({
  simpleLine: true,
  tables: true,
  tasklists: true,
  strikethrough: true
});

// 解析消息内容（处理代码块）
const parseMessage = (content) => {
  // 替换代码块为自定义的组件
  return converter.makeHtml(content);
};

// 处理代码块中的语言标识
const extractLanguage = (content) => {
  // 提取代码块的语言标识
  const match = content.match(/```(\w+)/);
  return match ? match[1] : '';
};

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
  }
};

// 监听消息变化或加载状态变化，自动滚动到底部
watch([() => props.messages, () => props.loading, () => props.thinking], scrollToBottom);

onMounted(scrollToBottom);
</script>

<template>
  <div class="message-list" ref="messageContainer">
    <div class="welcome-message" v-if="messages.length === 0 && !loading && !thinking">
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
          :src="message.role === 'user' ? userInfo.avatar || '/assets/user-avatar.png' : '/assets/ai-avatar.png'" 
          alt="Avatar" 
        />
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-name">{{ message.role === 'user' ? userInfo.name || '您' : 'AI助手' }}</span>
          <span class="message-time">{{ message.time }}</span>
        </div>
        <div class="message-body" v-html="parseMessage(message.content)"></div>
      </div>
    </div>
    
    <div class="thinking-process" v-if="thinking">
      <div class="message assistant">
        <div class="message-avatar">
          <img src="/assets/ai-avatar.png" alt="AI Avatar" />
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-name">AI助手</span>
            <span class="message-time">思考中...</span>
          </div>
          <div class="message-body thinking">
            <pre>{{ thinkingContent }}</pre>
          </div>
        </div>
      </div>
    </div>
    
    <div class="message-loading" v-if="loading && !thinking">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  scroll-behavior: smooth;
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

.message-body {
  color: #333;
  line-height: 1.5;
}

.message-body.thinking {
  font-family: monospace;
  color: #555;
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 5px;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
}

.typing-indicator span {
  height: 10px;
  width: 10px;
  margin: 0 2px;
  background-color: #3498db;
  display: block;
  border-radius: 50%;
  opacity: 0.4;
  animation: typing 1s infinite;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.3s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes typing {
  0% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.4; transform: scale(1); }
}

:deep(pre) {
  background-color: #282c34;
  color: #abb2bf;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
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
</style>