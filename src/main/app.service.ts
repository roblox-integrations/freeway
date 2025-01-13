import {join} from 'node:path'
import process from 'node:process'
import {is} from '@electron-toolkit/utils'
import {ElectronService} from '@main/electron/electron.service'
import {RobloxOauthClient} from '@main/roblox-api/roblox-oauth.client'
import {Injectable, Logger, OnModuleInit} from '@nestjs/common'
import {app, BrowserWindow, net} from 'electron'
import isOnline from 'is-online'

@Injectable()
export class AppService implements OnModuleInit {
  private logger = new Logger(AppService.name)
  private isNetOnline = false
  private _isOnline = false
  private isRefreshing = false

  constructor(
    private readonly oauthClient: RobloxOauthClient,
    private readonly electron: ElectronService,
  ) {
  }

  async onModuleInit(): Promise<void> {
    await this.electron.createWindow()

    app.on('activate', () => {
      // On macOS, it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0)
        this.electron.createWindow()
    })

    setInterval(() => {
      this.checkNetIsOnline()
    }, 1000)

    setInterval(() => {
      this.checkWebIsOnline()
    }, 5000)

    setInterval(() => {
      this.refreshTokens()
    }, 5000)

    // refresh token set on start
    this.refreshTokens()
      .then(() => {
        const mainWin = this.electron.getMainWindow()
        if (mainWin) {
          mainWin.webContents.send('ipc-message', {name: 'ready'})
        }
      })
  }

  public getTime(): number {
    return new Date().getTime()
  }

  static getAppUrl() {
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      return process.env.ELECTRON_RENDERER_URL
    }

    return `file://${join(__dirname, '../renderer/index.html')}`
  }

  private async checkNetIsOnline() {
    this.isNetOnline = net.isOnline()
    if (!this.isNetOnline) {
      this.isOnline = false
    }
  }

  private async checkWebIsOnline() {
    if (this.isNetOnline) {
      this.isOnline = await isOnline()
    }
  }

  private async refreshTokens() {
    if (!this.isOnline)
      return

    if (this.isRefreshing)
      return

    this.isRefreshing = true
    try {
      await this.oauthClient.refresh()
    }
    catch (err) {
      this.logger.error('Could not refresh token', err)
    }

    this.isRefreshing = false
  }

  set isOnline(isOnline: boolean) {
    if (isOnline && !this._isOnline) {
      this.logger.log('ONLINE')
      this.electron.getMainWindow()?.webContents.send('ipc-message', {name: 'app:online'})
    }

    if (!isOnline && this._isOnline) {
      this.logger.log('OFFLINE')
      this.electron.getMainWindow()?.webContents.send('ipc-message', {name: 'app:offline'})
    }

    this._isOnline = isOnline
  }

  get isOnline() {
    return this._isOnline
  }
}
