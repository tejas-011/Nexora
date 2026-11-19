import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    react(),
    {
      name: 'html-rewrite-plugin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url) {
            const [urlPath, query] = req.url.split('?');
            if (urlPath.endsWith('.html') && urlPath !== '/index.html' && !urlPath.startsWith('/@fs/')) {
              req.url = '/index.html' + (query ? '?' + query : '');
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5000,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:5001',
      '/app.js': 'http://localhost:5001',
      '/styles.css': 'http://localhost:5001',
      '/projects-data.js': 'http://localhost:5001',
      '/team-data.js': 'http://localhost:5001'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
