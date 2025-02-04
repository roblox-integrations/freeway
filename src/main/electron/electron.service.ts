import {join} from 'node:path'
import process from 'node:process'
import {is} from '@electron-toolkit/utils'
import {RobloxOauthClient} from '@main/roblox-api/roblox-oauth.client'

import {Injectable, Logger, OnModuleInit} from '@nestjs/common'
import {app, BrowserWindow, shell} from 'electron'

@Injectable()
export class ElectronService implements OnModuleInit {
  private logger = new Logger(ElectronService.name)
  private mainWindow?: BrowserWindow

  constructor(
    private readonly oauthClient: RobloxOauthClient,
  ) {
    //
  }

  async onModuleInit(): Promise<void> {
    app.on('activate', () => {
      // On macOS, it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0)
        this.createWindow()
    })
  }

  async createWindow() {
    const width = is.dev ? 1024 + 500 : 1024 // make window a bit wider when dev
    const height = 768

    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width,
      height,
      show: false,
      autoHideMenuBar: is.dev,
      icon: join(__dirname, '../../resources/icon.png'),
      title: 'Roblox Integration Hub',
      frame: true,
      webPreferences: {
        contextIsolation: true,
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false,
      },
    })

    mainWindow.on('ready-to-show', () => {
      mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return {action: 'deny'}
    })

    const webRequest = mainWindow.webContents.session.webRequest
    const filter = {urls: ['http://localhost:3000/oauth/callback*']}

    webRequest.onBeforeRequest(filter, async ({url}) => {
      try {
        await this.oauthClient.callback(url)
        await mainWindow.loadURL(this.getRendererUrl())
      }
      catch (err: any) {
        mainWindow.webContents.send('auth:err:load-tokens')
        this.logger.error(err.message)
        this.logger.error(err.stack)
      }
    })

    mainWindow.on('closed', () => {
      this.onClosed()
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    await mainWindow.loadURL(this.getRendererUrl())

    if (is.dev) {
      mainWindow.webContents.openDevTools()
      // mainWindow.maximize()
    }

    this.mainWindow = mainWindow

    return mainWindow
  }

  getMainWindow() {
    return this.mainWindow
  }

  onClosed() {
    this.mainWindow = null
  }

  getRendererUrl() {
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      return process.env.ELECTRON_RENDERER_URL
    }

    return `file://${join(__dirname, '../renderer/index.html')}`
  }
}
