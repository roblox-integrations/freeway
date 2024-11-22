import {join} from 'node:path'
import process from 'node:process'
import {Window} from '@doubleshot/nest-electron'
import {is} from '@electron-toolkit/utils'
import {RobloxOauthClient} from '@main/roblox-api/roblox-oauth.client'
import {Injectable, Logger, OnModuleInit} from '@nestjs/common'
import {BrowserWindow, net} from 'electron'
import isOnline from 'is-online'

@Injectable()
export class AppService implements OnModuleInit {
  private logger = new Logger(AppService.name)
  private isNetOnline = false
  private _isOnline = false
  private isRefreshing = false

  constructor(
      @Window() private readonly mainWin: BrowserWindow,
      private readonly oauthClient: RobloxOauthClient,
  ) {
    const webRequest = this.mainWin.webContents.session.webRequest
    const filter = {urls: ['http://localhost:3000/oauth/callback*']}

    webRequest.onBeforeRequest(filter, async ({url}) => {
      try {
        await this.oauthClient.callback(url)
        await this.loadMain()
      }
      catch (err: any) {
        this.mainWin.webContents.send('auth:err:load-tokens')
        // TODO: show error
        this.logger.error(err.message)
        this.logger.error(err.stack)
      }
    })
  }

  async onModuleInit(): Promise<void> {
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
        this.mainWin.webContents.send('ipc-message', {name: 'ready'})
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
      this.mainWin.webContents.send('ipc-message', {name: 'app:online'})
    }

    if (!isOnline && this._isOnline) {
      this.logger.log('OFFLINE')
      this.mainWin.webContents.send('ipc-message', {name: 'app:offline'})
    }

    this._isOnline = isOnline
  }

  get isOnline() {
    return this._isOnline
  }

  async loadMain() {
    await this.mainWin.loadURL(AppService.getAppUrl())
  }
}
