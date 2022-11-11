# importmap-plugin
Rollup import maps plugin

# Usage
```ts
import ImportmapPlugin from 'importmap-plugin';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        format: 'system', // 'system' or 'es'
        entryFileNames: 'app/index.js',
        chunkFileNames: 'chunks/[name].js', // DO NOT INCLUDE HASH HERE
        plugins: [
          ImportmapPlugin({
            base: '/',
            external: true, // external import maps work only for SystemJs
          }),
        ],
      },
    },
  },
});
```

# Disclaimer
This is just a proof of concept. Use at your own risk.
