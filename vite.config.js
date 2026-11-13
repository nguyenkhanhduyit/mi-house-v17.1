import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'spa',
  // React automatic JSX transform: imported components work without relying on a global React.
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
  server: { host: '0.0.0.0', port: 555, strictPort: true, proxy: {'/api': {target: 'http://127.0.0.1:5551', changeOrigin: true}} },
  preview: { host: '0.0.0.0', port: 555, strictPort: true },
});
