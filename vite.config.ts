import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 使用环境变量控制base路径，默认为根路径
  // Docker部署: VITE_BASE_PATH=/
  // GitHub Pages: VITE_BASE_PATH=/juben2/
  base: process.env.VITE_BASE_PATH || '/juben2/',
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  build: {
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心库
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // UI 组件库 - Radix UI
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
          ],
          
          // 工具库
          'vendor-utils': ['zustand', 'dexie', 'date-fns', 'lucide-react'],
          
          // 🆕 编辑器相关（Monaco Editor 较大）
          'vendor-editor': ['@monaco-editor/react', 'monaco-editor'],
          
          // 🆕 图表和可视化
          'vendor-charts': ['recharts', 'react-force-graph-2d', 'vis-network', 'vis-data'],
          
          // 🆕 导出功能（较大）
          'vendor-export': ['docx', 'jspdf', 'html2canvas', 'html-to-image', 'file-saver'],
          
          // 🆕 React Query 和数据管理
          'vendor-query': ['@tanstack/react-query', '@tanstack/react-query-devtools', '@tanstack/react-virtual'],
          
          // 🆕 表单和验证
          'vendor-form': ['react-hook-form', 'zod'],
          
          // 🆕 拖拽功能
          'vendor-dnd': ['react-dnd', 'react-dnd-html5-backend'],
        },
      },
    },
    // 🆕 增加 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
  },
  esbuild: {
    // 生产环境移除 console 和 debugger
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
})
