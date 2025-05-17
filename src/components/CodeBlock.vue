<script setup>
import { ref } from 'vue';

const props = defineProps({
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: ''
  }
});

const copied = ref(false);

const copyCode = () => {
  navigator.clipboard.writeText(props.code);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};
</script>

<template>
  <div class="code-block">
    <div class="code-header">
      <span class="language">{{ language }}</span>
      <button @click="copyCode" class="copy-button">
        {{ copied ? '已复制!' : '复制代码' }}
      </button>
    </div>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>

<style scoped>
.code-block {
  background-color: #282c34;
  border-radius: 6px;
  margin: 12px 0;
  position: relative;
  font-family: 'Courier New', Courier, monospace;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  border-bottom: 1px solid #3e4451;
  background-color: #21252b;
  border-radius: 6px 6px 0 0;
}

.language {
  color: #abb2bf;
  font-size: 13px;
  font-weight: 500;
}

.copy-button {
  background-color: #4d78cc;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.copy-button:hover {
  background-color: #5a88db;
}

pre {
  margin: 0;
  padding: 15px;
  overflow-x: auto;
}

code {
  color: #abb2bf;
  font-size: 14px;
  line-height: 1.5;
}
</style>