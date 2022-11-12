# importmap-plugin
Vite/Rollup import maps plugin

# Usage
```ts
// vite.config.ts
import ImportmapPlugin from 'importmap-plugin';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        format: 'system', // 'system' or 'es'
        entryFileNames: 'app/index.js', // DO NOT INCLUDE HASH HERE
        chunkFileNames: 'chunks/[name].js', // DO NOT INCLUDE HASH HERE
        plugins: [
          ImportmapPlugin({
            base: '/', // same as `base` option in Vite config
            external: true, // external import maps work only for SystemJS
            indexHtml: 'index.html', // entry html file name
          }),
        ],
      },
    },
  },
});
```

# Disclaimer
This is just a proof of concept. Use at your own risk.
