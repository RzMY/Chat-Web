<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import FaceCapture from '../components/FaceCapture.vue';
import { API, apiRequest } from '../utils/api';

const router = useRouter();
const faceCapture = ref(null);
const loading = ref(false);
const showErrors = ref(false);

const formData = reactive({
  name: '',
  age: '',
  phone: ''
});

const fieldValidation = reactive({
  name: false,
  age: false,
  phone: false
});

const checkField = (field) => {
  fieldValidation[field] = true;
  if (Object.values(fieldValidation).some(val => val)) {
    showErrors.value = true;
  }
};

const validateForm = () => {
  showErrors.value = true;
  return formData.name && formData.age && formData.phone;
};

const register = async () => {
  if (!validateForm()) {
    return;
  }
  
  loading.value = true;
  const imageData = faceCapture.value.captureImage();
  
  if (!imageData) {
    loading.value = false;
    alert('无法获取人脸图像，请检查摄像头');
    return;
  }
  
  try {
    // 使用API配置发送请求
    const data = await apiRequest(API.faceCollect, {
      method: 'POST',
      body: JSON.stringify({
        name: formData.name,
        age: formData.age,
        phone: formData.phone,
        image: imageData
      })
    });
    
    alert(data.msg || '注册成功！');
    
    if (data.code === 200) {
      // 注册成功，跳转到登录页
      router.push('/login');
    }
  } catch (error) {
    console.error('注册失败:', error);
    alert('系统错误，请稍后再试');
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <div class="header">
        <h1>人脸信息采集系统</h1>
        <p>请保持面部在摄像头范围内，并填写相关信息</p>
      </div>
      
      <div class="content">
        <FaceCapture ref="faceCapture" />
        
        <div class="form-group">
          <label>姓名</label>
          <input 
            type="text" 
            v-model="formData.name" 
            placeholder="请输入您的姓名" 
            :class="{ error: showErrors && !formData.name }" 
            @blur="checkField('name')" 
          />
          <span class="error-message" v-if="showErrors && !formData.name">姓名不能为空</span>
        </div>
        
        <div class="form-group">
          <label>年龄</label>
          <input 
            type="number" 
            v-model="formData.age" 
            placeholder="请输入您的年龄" 
            :class="{ error: showErrors && !formData.age }" 
            @blur="checkField('age')" 
          />
          <span class="error-message" v-if="showErrors && !formData.age">年龄不能为空</span>
        </div>
        
        <div class="form-group">
          <label>电话</label>
          <input 
            type="tel" 
            v-model="formData.phone" 
            placeholder="请输入您的联系电话" 
            :class="{ error: showErrors && !formData.phone }" 
            @blur="checkField('phone')" 
          />
          <span class="error-message" v-if="showErrors && !formData.phone">电话不能为空</span>
        </div>
        
        <button type="button" @click="register" :disabled="loading">
          {{ loading ? '处理中...' : '采集人脸信息' }}
        </button>
        
        <div class="login-link">
          <p>已有账号？ <a href="#" @click.prevent="goToLogin">返回登录</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 550px;
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

.form-group {
  margin-bottom: 20px;
  position: relative;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #2c3e50;
  font-weight: 600;
}

.login-link {
  text-align: center;
  margin-top: 20px;
}

.login-link a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>