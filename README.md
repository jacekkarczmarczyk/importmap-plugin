# importmap-plugin
Rollup import maps plugin

# Usage
```ts
import ImportmapPlugin from 'importmap-plugin';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'app/index.js',
        chunkFileNames: 'chunks/[name].js', // DO NOT INCLUDE HASH HERE
        plugins: [
          ImportmapPlugin(),
        ],
      },
    },
  },
});
```

# Disclaimer
This is just a proof of concept. Use at your own risk.
