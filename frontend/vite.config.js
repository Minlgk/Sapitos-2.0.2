import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables from .env file
  const env = loadEnv(mode, process.cwd(), '');
  
  // Set default backend URL if not provided in environment
  const backendUrl = env.VITE_BACKEND_URL || 'https://sapitos-backend.cfapps.us10-001.hana.ondemand.com';
  
  return {
    plugins: [react()],
    server: {  
      proxy: {
        "/inventory": {
          target: backendUrl, 
          changeOrigin: true,
          secure: false,
        },
        "/alertas": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        "/users": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        "/location": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        }
      },
    },
    define: {
      // Define global constants that will be replaced at build time
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(backendUrl),
    }
  };
});