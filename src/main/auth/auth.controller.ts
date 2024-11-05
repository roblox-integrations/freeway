import {IpcHandle} from '@doubleshot/nest-electron'
import {RobloxOauthClient} from '@main/roblox-api/roblox-oauth.client'
import {Controller, Get} from '@nestjs/common'
import {of} from 'rxjs'
import {AuthService} from './auth.service'

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService, private robloxOauthClient: RobloxOauthClient) {}

  @Get('/account')
  public account() {
    return this.authService.getProfile()
  }

  @Get('/resources')
  public resources() {
    return this.robloxOauthClient.getAuthorizedResources()
  }

  @IpcHandle('profile')
  public handleGetAccount() {
    return of(this.authService.getProfile())
  }
}

// session:account
// session:authorized-resources
// session:login
// session:logout
