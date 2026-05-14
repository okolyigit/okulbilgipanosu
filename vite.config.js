import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Vite dev server için CF Pages _redirects kurallarını taklit eden middleware.
// Bu, `npm run dev` ile çalıştırılan dev server'da production URL'lerinin de
// (örn. /kayit, /giris, /:slug, /:slug/admin) doğru sayfayı servis etmesini sağlar.
function pagesRewrites() {
  const rewrites = [
    { match: /^\/giris\/?$/, to: '/login.html' },
    { match: /^\/kayit\/?$/, to: '/register.html' },
    { match: /^\/demo\/?$/, to: '/demopano.html' },
    { match: /^\/[^/]+\/admin\/?$/, to: '/admin.html' },
    { match: /^\/[^/]+\/login\/?$/, to: '/login.html' },
    { match: /^\/[^/]+\/?$/, to: '/board.html' }
  ];

  // Statik dosya isimleri ve özel path'ler — eşleştirmenin atlanacağı önekler
  const skip = (url) => {
    if (url === '/' || url === '/index.html') return true;
    if (url.startsWith('/api/')) return true;
    if (url.startsWith('/src/')) return true;
    if (url.startsWith('/assets/')) return true;
    if (url.startsWith('/node_modules/')) return true;
    if (url.startsWith('/@')) return true; // vite internals
    if (/\.[a-z0-9]+$/i.test(url)) return true; // her türlü .ext
    return false;
  };

  return {
    name: 'pages-rewrites',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url.split('?')[0];
        if (skip(url)) return next();
        for (const r of rewrites) {
          if (r.match.test(url)) {
            req.url = r.to + req.url.slice(url.length);
            return next();
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [pagesRewrites()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        board: resolve(__dirname, 'board.html'),
        admin: resolve(__dirname, 'admin.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        demo: resolve(__dirname, 'demopano.html')
      }
    }
  }
});
