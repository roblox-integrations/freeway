import {Module} from '@nestjs/common'
import {RobloxApiService} from './roblox-api.service'
import {RobloxOauthClient} from './roblox-oauth.client'

@Module({
  providers: [RobloxApiService, RobloxOauthClient],
  exports: [RobloxApiService, RobloxOauthClient],
})
export class RobloxApiModule {}
