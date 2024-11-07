import {IpcHandle, IpcOn, Window} from '@doubleshot/nest-electron'
import {RobloxOauthClient} from '@main/roblox-api/roblox-oauth.client'
import {Controller, Get, Logger} from '@nestjs/common'
import {Payload} from '@nestjs/microservices'
import {BrowserWindow, shell} from 'electron'
import {type Observable, of} from 'rxjs'
import {AppService} from './app.service'

@Controller()
export class AppController {
  private logger = new Logger(AppController.name)

  constructor(
    private readonly appService: AppService,
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

    let isRefreshing = false
    const refreshTokens = async () => {
      if (isRefreshing)
        return
      isRefreshing = true
      try {
        await this.oauthClient.refresh()
      }
      catch (err) {
        this.logger.error('Could not refresh token', err)
      }
      isRefreshing = false
    }

    refreshTokens() // refresh token set on start
      .then(() => {
        this.mainWin.webContents.send('ipc-message', {name: 'ready'})
      })

    setInterval(refreshTokens, 2000)
  }

  async loadMain() {
    await this.mainWin.loadURL(AppService.getAppUrl())
  }

  @IpcHandle('msg')
  public handleSendMsg(@Payload() msg: string): Observable<string> {
    this.mainWin.webContents.send('reply-msg', 'this is msg from webContents.send')
    return of(`The main process received your message: ${msg} at time: ${this.appService.getTime()}`)
  }

  @IpcOn('auth:login')
  public handleAuthLogin() {
    this.mainWin.loadURL(this.oauthClient.createAuthorizeUrl())
  }

  @IpcOn('auth:logout')
  public async handleAuthLogout() {
    const tokenSet = await this.oauthClient.getTokenSet()

    if (tokenSet) {
      await this.oauthClient.revokeToken(tokenSet.refreshToken)
      await this.oauthClient.resetTokenSet()
    }
  }

  @IpcOn('open:external')
  public async handleOpenExternal(url: string) {
    await shell.openExternal(url)
  }

  @IpcOn('app:beep')
  public ipcBeep() {
    shell.beep() // Just for fun
    return {message: 'bop'}
  }

  @Get('beep')
  public getAppBeep() {
    shell.beep() // Just for fun
    return {message: 'bop'}
  }

  @IpcOn('reveal')
  public reveal(@Payload() path: string): void {
    shell.showItemInFolder(path)
  }

  @Get('/')
  public root() {
    return {message: 'hello'}
  }
}
