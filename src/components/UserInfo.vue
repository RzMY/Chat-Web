<script setup>
import { computed } from 'vue'
import { useUserStore } from '../store/index'
import { useRouter } from 'vue-router'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const userStore = useUserStore()
const router = useRouter()

const user = computed(() => userStore.userInfo || {
  name: '访客用户',
  avatar: '/assets/default-avatar.png'
})

const logout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="user-profile" :class="{ 'collapsed': collapsed }">
    <div class="user-avatar">
      <img :src="user.avatar" alt="用户头像">
    </div>
    
    <div class="user-details" v-if="!collapsed">
      <div class="user-name">{{ user.name }}</div>
      <div class="logout-button" @click="logout">退出登录</div>
    </div>
  </div>
</template>

<style scoped>
.user-profile {
  display: flex;
  align-items: center;
  padding: 15px;
  border-top: 1px solid #444654;
  transition: all 0.3s ease;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.user-profile.collapsed .user-avatar {
  margin-right: 0;
}
</style>