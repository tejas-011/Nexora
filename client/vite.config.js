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
            if (urlPath.endsWith('.html') && urlPath !== '/index.html') {
              req.url = '/index.html' + (query ? '?' + query : '');
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/app.js': 'http://localhost:5000',
      '/styles.css': 'http://localhost:5000',
      '/projects-data.js': 'http://localhost:5000',
      '/team-data.js': 'http://localhost:5000'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
