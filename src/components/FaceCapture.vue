<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import faceUtile from '../utils/faceUtil';

const props = defineProps({
  width: {
    type: Number,
    default: 400
  },
  height: {
    type: Number,
    default: 300
  }
});

const emit = defineEmits(['capture']);

const isCapturing = ref(false);

onMounted(() => {
  faceUtile.width = props.width;
  faceUtile.height = props.height;
  faceUtile.openVideo("video-container");
});

onBeforeUnmount(() => {
  // 关闭摄像头，避免资源泄露
  if (faceUtile.isOpen) {
    const stream = document.getElementById("myVideo").srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  }
});

const captureImage = () => {
  if (!faceUtile.isOpen) {
    return null;
  }
  
  isCapturing.value = true;
  const imageData = faceUtile.getDecode();
  emit('capture', imageData);
  setTimeout(() => {
    isCapturing.value = false;
  }, 1000);
  
  return imageData;
};

defineExpose({
  captureImage
});
</script>

<template>
  <div class="face-capture">
    <div class="camera-box">
      <div id="video-container"></div>
    </div>
    <div class="capture-overlay" v-if="isCapturing">
      <div class="capture-flash"></div>
    </div>
  </div>
</template>

<style scoped>
.face-capture {
  position: relative;
  width: 100%;
  max-width: v-bind('width + "px"');
  margin: 0 auto;
}

.camera-box {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.capture-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  pointer-events: none;
}

.capture-flash {
  width: 100%;
  height: 100%;
  background-color: white;
  opacity: 0;
  animation: flash 0.5s ease-out;
}

@keyframes flash {
  0% { opacity: 0; }
  50% { opacity: 0.8; }
  100% { opacity: 0; }
}
</style>