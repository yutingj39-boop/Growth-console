import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 关键：设置根路径'/'，修复Netlify上的资源加载白屏问题。
  base: '/', 
})
