import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // 1. 플러그인 설정
  plugins: [react()], 

  // 2. 개발 서버 설정
  server: {
    port: 3000, // 개발 서버 포트 (기존 CRA 기본값과 유사하게 설정)
    open: true, // 서버 시작 시 브라우저 자동 열림
  },

  // 3. 빌드 설정
  build: {
    // 백엔드 (Spring Boot)의 정적 파일 경로로 설정
    // 이 경로가 백엔드 프로젝트의 `src/main/resources/static` 경로와 일치해야 합니다.
    outDir: '../resources/static', 
    
    // 정적 리소스(CSS/JS)가 저장될 내부 경로. 
    // Spring Boot 환경에서는 보통 루트를 사용합니다.
    assetsDir: '', 
    
    // 소스 맵 파일 생성 비활성화 (선택적)
    sourcemap: false, 
    
    // 이전 환경에서 사용하던 chunk를 위한 설정 (선택적)
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  
   resolve: {
     alias: {
       '@': path.resolve(__dirname, './src'),
     },
   },
});