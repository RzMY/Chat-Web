import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 8888,
    host: "0.0.0.0",
    https: true,
  },
  plugins: [vue(), basicSsl()],
})
