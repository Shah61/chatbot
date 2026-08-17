import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Accepts a bare host, exactly as the client reads the same variable. */
const withProtocol = (v: string) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v);

export default defineConfig(({ mode }) => {
  /* '' as the prefix loads every key, not just the VITE_ ones, so SERVER_URL
     is visible here too. */
  const env = loadEnv(mode, process.cwd(), '');

  /* The dev proxy points at whichever backend the deployed build talks to, so
     one variable covers both environments. SERVER_URL still wins, for pointing
     dev at a local server without editing .env. */
  const target = withProtocol(
    (env.SERVER_URL || env.VITE_API_URL || 'http://localhost:8787').trim().replace(/\/+$/, ''),
  );

  return {
    plugins: [react()],
    server: {
      proxy: {
        /* Keeps the browser on one origin. No preflight, and the session
           cookie stays first-party — so the backend only ever has to allow the
           deployed origin, never localhost. */
        '/api': {
          target,
          changeOrigin: true,
          configure: (proxy) => {
            /* changeOrigin rewrites Host but not Origin, so the backend still
               saw http://localhost:5173 and answered 403 forbidden_origin. It
               accepts a request with no Origin at all — which is what a proxy
               hop honestly is — so drop the header on the way through. */
            proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
          },
        },
      },
    },
  };
});
