<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}

body {
  background-color: #f5f7fa;
  color: #333;
  line-height: 1.6;
  height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 全局按钮样式 */
button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 18px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

button:hover {
  background-color: #2980b9;
}

button:active {
  transform: scale(0.98);
}

/* 输入框样式 */
input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: all 0.3s;
}

input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}
</style>