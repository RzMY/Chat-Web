import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Chat from '../views/Chat.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/register',
      name: 'register',
      component: Register
    },
    {
      path: '/chat',
      name: 'chat',
      component: Chat,
      meta: { requiresAuth: true }
    }
  ]
})

// 简单的路由守卫（实际项目中需要更复杂的验证）
router.beforeEach((to, from, next) => {
  // 这里可以添加验证逻辑，比如检查本地存储中是否有token
  // const isAuthenticated = localStorage.getItem('token')
  
  // 临时模拟登录状态，实际项目中应当从后端验证
  const isAuthenticated = true
  
  if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router