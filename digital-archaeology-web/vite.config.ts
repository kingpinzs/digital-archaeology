import { defineConfig } from 'vite';
import { resolve } from 'path';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  resolve: {
    alias: {
      '@editor': resolve(__dirname, './src/editor'),
      '@emulator': resolve(__dirname, './src/emulator'),
      '@visualizer': resolve(__dirname, './src/visualizer'),
      '@debugger': resolve(__dirname, './src/debugger'),
      '@state': resolve(__dirname, './src/state'),
      '@story': resolve(__dirname, './src/story'),
      '@ui': resolve(__dirname, './src/ui'),
      '@types': resolve(__dirname, './src/types'),
      '@utils': resolve(__dirname, './src/utils'),
    }
  }
});
