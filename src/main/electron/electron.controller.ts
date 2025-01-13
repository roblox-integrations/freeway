import {IpcOn} from '@doubleshot/nest-electron'
import {ElectronService} from '@main/electron/electron.service'
import {RobloxOauthClient} from '@main/roblox-api/roblox-oauth.client'
import {Controller} from '@nestjs/common'

@Controller()
export class ElectronController {
  constructor(
    private readonly oauthClient: RobloxOauthClient,
    private readonly electron: ElectronService,
  ) {
  }

  @IpcOn('auth:login')
  public handleAuthLogin() {
    this.electron.getMainWindow()?.loadURL(this.oauthClient.createAuthorizeUrl())
  }

  @IpcOn('auth:logout')
  public async handleAuthLogout() {
    const tokenSet = await this.oauthClient.getTokenSet()

    if (tokenSet) {
      await this.oauthClient.revokeToken(tokenSet.refreshToken)
      await this.oauthClient.resetTokenSet()
    }
  }
}
