import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import monacoEditorPluginModule from 'vite-plugin-monaco-editor';
import { createAliases } from './vite.aliases';

// Handle both ESM and CJS module formats
const monacoEditorPlugin = (monacoEditorPluginModule as unknown as { default: typeof monacoEditorPluginModule }).default || monacoEditorPluginModule;

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService'],
      // Only include base worker - syntax highlighting added in Story 2.2
    }),
  ],
  resolve: {
    alias: createAliases(__dirname),
  },
});
