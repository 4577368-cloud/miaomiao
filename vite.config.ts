import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // 1. 显式设置基础路径为根目录
  // 确保在自定义域名 xuanshu.qzz.io 下，资源引用不会指向错误的相对路径
  base: "/", 
  
  plugins: [uni()],
  
  css: {
    preprocessorOptions: {
      scss: {
        // 自动导入全局变量
        additionalData: `@import "@/styles/vars.scss";`
      }
    }
  },
  
  resolve: {
    alias: {
      // 使用 path.resolve 确保别名在构建时绝对准确
      '@': path.resolve(__dirname, 'src') 
    }
  },
  
  build: {
    // 2. 静态资源输出目录
    // 使用默认 assets 目录，避免与 static 目录混淆
    // assetsDir: 'assets',
    
    // 3. 输出目录设定
    // Uni-app 默认 H5 构建路径，请确保 Vercel 的 Output Directory 与此一致
    outDir: 'dist/build/h5',
    
    // 4. 优化生产环境打包
    minify: 'terser',
    terserOptions: {
      compress: {
        // 生产环境移除 console
        drop_console: true,
        drop_debugger: true
      }
    },
    
    // 5. 资源块大小警告限制
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // 对静态资源进行分块命名，防止浏览器缓存问题
        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: 'static/[ext]/[name]-[hash].[ext]'
      }
    }
  },
  
  // 6. 开发服务器配置
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: true
  }
});