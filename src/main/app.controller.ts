import {IpcHandle, IpcOn, Window} from '@doubleshot/nest-electron'
import {ConfigurationPiece} from '@main/_config/configuration'
import {RobloxOauthClient} from '@main/roblox-api/roblox-oauth.client'
import {Controller, Get} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {Payload} from '@nestjs/microservices'
import {BrowserWindow, shell} from 'electron'
import {type Observable, of} from 'rxjs'
import {AppService} from './app.service'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Window() private readonly mainWin: BrowserWindow,
    private readonly oauthClient: RobloxOauthClient,
    private config: ConfigService,
  ) {
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
  public async reveal(@Payload() path: string = ''): Promise<void> {
    if (path) {
      shell.showItemInFolder(path)
    }
    else {
      const path = this.config.get<ConfigurationPiece>('piece').watchDirectory
      await shell.openPath(path)
    }
  }

  @Get('/')
  public root() {
    return {message: 'hello'}
  }
}
