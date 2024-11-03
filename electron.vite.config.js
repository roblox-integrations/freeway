import {resolve} from 'node:path'
import react from '@vitejs/plugin-react'
import {defineConfig, externalizeDepsPlugin, swcPlugin} from 'electron-vite'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@main': resolve('src/main'),
        '@preload': resolve('src/preload'),
      },
    },
    plugins: [externalizeDepsPlugin(), swcPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@render': resolve('src/renderer'),
        '@components': resolve('src/renderer/components'),
      }
    },
    plugins: [react()],
  },
})
