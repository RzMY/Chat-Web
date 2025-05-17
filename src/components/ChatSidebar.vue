<script setup>
import { ref, computed } from 'vue';
import { API, apiRequest } from '../utils/api';
import { useUserStore, useChatStore } from '../store';

const userStore = useUserStore();

const props = defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  currentConversationId: {
    type: String,
    default: null
  },
  userInfo: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['select-conversation', 'new-chat', 'logout', 'rename-conversation', 'delete-conversation']);

const isCollapsed = ref(false);
const editingConversationId = ref(null); // 当前正在编辑的会话ID
const newTitle = ref(''); // 编辑时的新标题
const showDeleteConfirm = ref(false); // 显示删除确认
const pendingDeleteId = ref(null); // 待删除的会话ID
const showUserSettings = ref(false);
const detailUserInfo = ref(null);
const loadingUserInfo = ref(false);

// 打开用户设置对话框
const openUserSettings = async (event) => {
  console.log('打开用户设置对话框');
  // 阻止冒泡，避免触发其他点击事件
  if (event) event.stopPropagation();
  showUserSettings.value = true;
  await fetchUserDetails();
};

// 关闭用户设置对话框
const closeUserSettings = () => {
  showUserSettings.value = false;
};

// 获取用户详细信息
const fetchUserDetails = async () => {
  const userInfo = userStore.userInfo;
  console.log('查询用户信息', userInfo.id);

  if (!userInfo.id) return;
  
  loadingUserInfo.value = true;
  
  try {
    const response = await apiRequest(API.getUserInfo, {
      method: 'POST',
      body: JSON.stringify({
        user_id: userInfo.id
      })
    });
    
    if (response.code === 200 && response.userInfo) {
      detailUserInfo.value = response.userInfo;
    } else {
      console.error('获取用户详情失败:', response.msg);
    }
  } catch (error) {
    console.error('获取用户详情失败:', error);
  } finally {
    loadingUserInfo.value = false;
  }
};

// 切换侧边栏展开/折叠
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};

// 选择会话
const selectConversation = (id) => {
  emit('select-conversation', id);
};

// 创建新会话
const startNewChat = () => {
  emit('new-chat');
};

// 退出登录
const logout = () => {
  emit('logout');
};

// 开始编辑会话标题
const startEditing = (conversation) => {
  // 阻止事件冒泡，避免触发选择会话
  event.stopPropagation();
  editingConversationId.value = conversation.id;
  newTitle.value = conversation.title;
};

// 保存编辑的会话标题
const saveTitle = () => {
  if (newTitle.value.trim()) {
    emit('rename-conversation', editingConversationId.value, newTitle.value.trim());
  }
  cancelEditing();
};

// 取消编辑
const cancelEditing = () => {
  editingConversationId.value = null;
  newTitle.value = '';
};

// 确认删除会话弹窗
const confirmDelete = (id, event) => {
  event.stopPropagation();
  pendingDeleteId.value = id;
  showDeleteConfirm.value = true;
};

// 执行删除会话
const executeDelete = () => {
  if (pendingDeleteId.value) {
    emit('delete-conversation', pendingDeleteId.value);
    showDeleteConfirm.value = false;
    pendingDeleteId.value = null;
  }
};

// 取消删除
const cancelDelete = () => {
  showDeleteConfirm.value = false;
  pendingDeleteId.value = null;
};

// 按下Enter键完成编辑
const handleKeyDown = (event) => {
  if (event.key === 'Enter') {
    saveTitle();
  } else if (event.key === 'Escape') {
    cancelEditing();
  }
};
</script>

<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="toggle-button" @click="toggleSidebar">
      <span v-if="isCollapsed">→</span>
      <span v-else>←</span>
    </div>
    
    <div class="sidebar-content">
      <div class="sidebar-header" v-if="!isCollapsed">
        <button class="new-chat-button" @click="startNewChat">
          <span class="plus-icon">+</span> 新对话
        </button>
      </div>
      
      <div class="conversation-list" v-if="!isCollapsed">
        <div 
          v-for="conversation in conversations" 
          :key="conversation.id"
          @click="selectConversation(conversation.id)"
          class="conversation-item"
          :class="{ active: conversation.id === currentConversationId }"
        >
          <!-- 编辑模式 -->
          <div v-if="editingConversationId === conversation.id" class="edit-mode" @click.stop>
            <input 
              type="text" 
              v-model="newTitle" 
              @keydown="handleKeyDown" 
              ref="titleInput"
              class="edit-title-input" 
              autofocus
            />
            <div class="edit-buttons">
              <button @click="saveTitle" class="edit-btn save-btn">保存</button>
              <button @click="cancelEditing" class="edit-btn cancel-btn">取消</button>
            </div>
          </div>
          
          <!-- 正常显示模式 -->
          <div v-else class="conversation-content">
            <div class="conversation-title">{{ conversation.title }}</div>
            <div class="conversation-date">{{ conversation.date }}</div>
            <div class="conversation-actions" @click.stop>
              <button class="action-btn edit-btn" @click="startEditing(conversation)" title="重命名">
                <span>✎</span>
              </button>
              <button class="action-btn delete-btn" @click="confirmDelete(conversation.id, $event)" title="删除">
                <span>✕</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="user-profile" v-if="!isCollapsed">
        <div class="user-avatar">
          <img :src="userInfo.avatar || 'https://via.placeholder.com/40'" alt="用户头像">
        </div>
        <div class="user-info">
          <div class="user-name">{{ userInfo.name || '访客用户' }}</div>
          <div class="user-actions">
            <button class="settings-button" @click="openUserSettings" title="用户设置">
              <span>⚙️</span>
            </button>
            <span class="action-divider">|</span>
            <div class="logout-button" @click="logout">退出登录</div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="isCollapsed" class="collapsed-icons">
      <div class="icon-button" @click="startNewChat" title="新对话">
        <span>+</span>
      </div>
      <!-- 添加设置图标按钮 -->
      <div class="icon-button" @click="openUserSettings" title="用户设置">
        <span>⚙️</span>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="delete-confirm-modal">
      <div class="delete-confirm-content">
        <h3>确认删除</h3>
        <p>您确定要删除这个会话吗？此操作不可撤销。</p>
        <div class="confirm-buttons">
          <button @click="cancelDelete" class="cancel-btn">取消</button>
          <button @click="executeDelete" class="delete-btn">删除</button>
        </div>
      </div>
    </div>

        <!-- 添加用户设置对话框 -->
    <div v-if="showUserSettings" class="user-settings-modal">
      <div class="user-settings-content">
        <h3>用户信息</h3>
        <div class="close-button" @click="closeUserSettings">×</div>
        
        <div v-if="loadingUserInfo" class="loading-indicator">加载中...</div>
        
        <div v-else class="user-details">
          <div class="user-avatar-large">
            <img :src="detailUserInfo?.avatar || userInfo.avatar || 'https://via.placeholder.com/100'" alt="用户头像">
          </div>
          
          <div class="user-info-list">
            <div class="info-item">
              <span class="info-label">用户ID:</span>
              <span class="info-value">{{ detailUserInfo?.id || userInfo.id || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">姓名:</span>
              <span class="info-value">{{ detailUserInfo?.name || userInfo.name || '访客用户' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">年龄:</span>
              <span class="info-value">{{ detailUserInfo?.age || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">手机:</span>
              <span class="info-value">{{ detailUserInfo?.phone || '未设置' }}</span>
            </div>
          </div>
          
          <div class="settings-actions">
            <button @click="logout" class="logout-btn">注销登录</button>
            <button @click="closeUserSettings" class="close-btn">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  position: relative;
  width: 260px;
  height: 100%;
  background-color: #202123;
  color: #fff;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}

.sidebar.collapsed {
  width: 50px;
}

.toggle-button {
  position: absolute;
  right: -12px;
  top: 20px;
  width: 24px;
  height: 24px;
  background-color: #444654;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  z-index: 5;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #444654;
}

.new-chat-button {
  width: 100%;
  padding: 10px;
  background-color: #444654;
  border: 1px solid #565869;
  color: white;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.plus-icon {
  margin-right: 8px;
  font-size: 16px;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.conversation-item {
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 5px;
  transition: background-color 0.2s;
  position: relative;
}

.conversation-item:hover {
  background-color: #343541;
}

.conversation-item.active {
  background-color: #343541;
}

.conversation-content {
  position: relative;
}

.conversation-title {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 60px; /* 为操作按钮留出空间 */
}

.conversation-date {
  font-size: 12px;
  color: #8e8ea0;
  margin-top: 4px;
}

/* 会话操作按钮 */
.conversation-actions {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  opacity: 0;
  transition: opacity 0.2s;
}

.conversation-item:hover .conversation-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  color: #8e8ea0;
  cursor: pointer;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-left: 5px;
  font-size: 12px;
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.edit-btn:hover {
  color: #3498db;
}

.delete-btn:hover {
  color: #e74c3c;
}

/* 编辑模式 */
.edit-mode {
  padding: 5px 0;
}

.edit-title-input {
  width: 100%;
  padding: 8px;
  background-color: #343541;
  border: 1px solid #565869;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  margin-bottom: 8px;
}

.edit-title-input:focus {
  outline: none;
  border-color: #3498db;
}

.edit-buttons {
  display: flex;
  justify-content: space-between;
}

.edit-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  flex: 1;
}

.save-btn {
  background-color: #3498db;
  color: white;
  margin-right: 5px;
}

.cancel-btn {
  background-color: #444654;
  color: white;
  margin-left: 5px;
}

/* 删除确认对话框 */
.delete-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.delete-confirm-content {
  background-color: #343541;
  border-radius: 8px;
  padding: 20px;
  width: 300px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.delete-confirm-content h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #fff;
}

.delete-confirm-content p {
  margin-bottom: 20px;
  color: #ccc;
  font-size: 14px;
}

.confirm-buttons {
  display: flex;
  justify-content: center;
}

.confirm-buttons button {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin: 0 5px;
}

.confirm-buttons .cancel-btn {
  background-color: #444654;
  color: white;
}

.confirm-buttons .delete-btn {
  background-color: #e74c3c;
  color: white;
}

.user-profile {
  padding: 15px;
  border-top: 1px solid #444654;
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
}

.logout-button {
  font-size: 12px;
  color: #8e8ea0;
  cursor: pointer;
  margin-top: 4px;
}

.logout-button:hover {
  text-decoration: underline;
  color: white;
}

.collapsed-icons {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
}

.icon-button {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #444654;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 15px;
  transition: all 0.3s;
}

.icon-button:hover {
  background-color: #565869;
}

/* 用户操作区域 */
.user-actions {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #8e8ea0;
  margin-top: 4px;
}

.settings-button {
  background: none;
  border: none;
  color: #8e8ea0;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.settings-button:hover {
  color: white;
}

.action-divider {
  margin: 0 8px;
  color: #565869;
}

/* 用户设置对话框 */
.user-settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.user-settings-content {
  background-color: #343541;
  border-radius: 8px;
  padding: 20px;
  width: 360px;
  max-width: 90%;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.user-settings-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
  color: #fff;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  color: #8e8ea0;
  cursor: pointer;
}

.close-button:hover {
  color: white;
}

.loading-indicator {
  text-align: center;
  padding: 20px;
  color: #8e8ea0;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 20px;
  border: 3px solid #565869;
}

.user-avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info-list {
  width: 100%;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #444654;
}

.info-label {
  color: #8e8ea0;
}

.info-value {
  color: white;
  font-weight: 500;
}

.settings-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.settings-actions button {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  min-width: 100px;
}

.logout-btn {
  background-color: #e74c3c;
  color: white;
}

.logout-btn:hover {
  background-color: #c0392b;
}

.close-btn {
  background-color: #444654;
  color: white;
}

.close-btn:hover {
  background-color: #565869;
}
</style>