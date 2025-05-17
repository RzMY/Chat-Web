<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import FaceCapture from '../components/FaceCapture.vue';
import { API, apiRequest } from '../utils/api';
import { useUserStore } from '../store';

const router = useRouter();
const userStore = useUserStore();
const faceCapture = ref(null);
const loading = ref(false);
const errorMessage = ref('');

const loginWithFace = async () => {
  errorMessage.value = '';
  loading.value = true;
  
  const imageData = faceCapture.value.captureImage();
  if (!imageData) {
    errorMessage.value = '无法获取人脸图像，请检查摄像头';
    loading.value = false;
    return;
  }
  
  try {
    // 发送人脸识别请求，使用API配置
    const data = await apiRequest(API.faceDetect, {
      method: 'POST',
      body: JSON.stringify({ image: imageData })
    });
    
    if (data.code === 200) {
      // 存储用户信息和token
      if (data.userInfo) {
        userStore.setUser(data.userInfo);
      }
      if (data.token) {
        userStore.setToken(data.token);
      }
      
      // 登录成功，跳转到聊天页面
      router.push('/chat');
    } else {
      errorMessage.value = data.msg || '人脸识别失败，请重试';
    }
  } catch (error) {
    console.error('登录失败:', error);
    errorMessage.value = '系统错误，请稍后再试';
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="header">
        <h1>人脸识别登录</h1>
        <p>请保持面部在摄像头范围内</p>
      </div>
      
      <div class="content">
        <FaceCapture ref="faceCapture" />
        
        <div class="error-alert" v-if="errorMessage">{{ errorMessage }}</div>
        
        <button 
          :disabled="loading"
          @click="loginWithFace" 
          class="login-button"
        >
          {{ loading ? '识别中...' : '人脸登录' }}
        </button>
        
        <div class="register-link">
          <p>没有账号？ <a href="#" @click.prevent="goToRegister">立即注册</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 500px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  padding: 25px 20px;
  text-align: center;
}

.header h1 {
  font-size: 24px;
  margin-bottom: 5px;
  font-weight: 500;
}

.content {
  padding: 30px;
}

.login-button {
  width: 100%;
  margin-top: 20px;
}

.error-alert {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
}

.register-link {
  text-align: center;
  margin-top: 20px;
}

.register-link a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>