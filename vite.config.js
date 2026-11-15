import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    // npm run start: built site + relay server. npm run dev: local UI work.
    proxy: {
      '/api/relay': 'http://127.0.0.1:4174'
    }
  }
});
