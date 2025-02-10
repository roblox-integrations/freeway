import {ElectronService} from '@main/electron/electron.service'
import {RobloxOauthClient} from '@main/roblox-api/roblox-oauth.client'
import {Injectable, Logger, OnModuleInit} from '@nestjs/common'
import {Interval, Timeout} from '@nestjs/schedule'
import {net} from 'electron'
import electronUpdater, {UpdateInfo} from 'electron-updater'
import isOnline from 'is-online'

const autoUpdater = electronUpdater.autoUpdater
autoUpdater.autoDownload = false
autoUpdater.forceDevUpdateConfig = true

@Injectable()
export class AppService implements OnModuleInit {
  private logger = new Logger(AppService.name)
  private isNetOnline = false
  private _isOnline = false
  private isRefreshing = false
  private updateInfo: UpdateInfo = null

  constructor(
    private readonly oauthClient: RobloxOauthClient,
    private readonly electron: ElectronService,
  ) {
    //
  }

  async onModuleInit(): Promise<void> {
    await this.electron.createWindow()

    this.checkNetIsOnline().then(() => {
      this.checkWebIsOnline()
    })

    // refresh token set on start
    this.refreshTokens()
      .then(() => {
        const mainWin = this.electron.getMainWindow()
        if (mainWin) {
          mainWin.webContents.send('ipc-message', {name: 'ready'})
        }
      })

    autoUpdater.on('update-available', (updateInfo) => {
      this.updateInfo = updateInfo
      this.logger.log('---- UPDATE AVAILABLE ----', updateInfo)
      this.electron.getMainWindow()?.webContents.send('ipc-message', {name: 'app:update-available', data: updateInfo})
    })
  }

  get isUpdateAvailable() {
    return this.updateInfo !== null
  }

  getUpdateInfo(): UpdateInfo {
    return this.updateInfo
  }

  @Timeout(1_000)
  protected async timeoutCheckForUpdate(): Promise<void> {
    await this.checkForUpdate()
  }

  @Interval(120_000)
  protected async intervalCheckForUpdate(): Promise<void> {
    await this.checkForUpdate()
  }

  protected async checkForUpdate(): Promise<void> {
    if (this.isUpdateAvailable) {
      return
    }

    await autoUpdater.checkForUpdatesAndNotify()
  }

  @Interval(1000)
  protected async checkNetIsOnline() {
    this.isNetOnline = net.isOnline()
    if (!this.isNetOnline) {
      this.isOnline = false
    }
  }

  @Interval(5000)
  protected async checkWebIsOnline() {
    if (this.isNetOnline) {
      this.isOnline = await isOnline()
    }
  }

  @Interval(10_000)
  protected async refreshTokens() {
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
