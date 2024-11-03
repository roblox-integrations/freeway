import {ProfileDto} from '@main/auth/dto'
import {RobloxOauthClient} from '@main/roblox-api/roblox-oauth.client'
import {Injectable} from '@nestjs/common'

@Injectable()
export class AuthService {
  constructor(private oauthClient: RobloxOauthClient) {
  }

  async getProfile(): Promise<ProfileDto> {
    await this.oauthClient.assertTokenSetIsValid()

    const tokenSet = await this.oauthClient.getTokenSet()

    return ProfileDto.createFromProfileOAuthDto(tokenSet.claims)
  }
}
