/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration
 */
const config = {
  appId: "com.roblox.RobloxIntegrationHub",
  icon: 'resources/icon.ico',
  extraResources: [
    "static/**/*"
  ],
  directories: {
    output: 'dist/electron',
    buildResources: "resources",
  },
  publish: null,
  npmRebuild: false,
  files: [
    'dist/main/**/*',
    'dist/preload/**/*',
    'dist/render/**/*',
    "resources/**/*"
  ],
  "win": {
    "asar": true,
    "target": "nsis",
    "icon": "resources/icon.ico",
    "signAndEditExecutable": true
  },
  "nsis": {
    "installerIcon": "resources/icon.ico",
    "installerHeaderIcon": "resources/icon.ico",
    "deleteAppDataOnUninstall": true
  },
}

module.exports = config

