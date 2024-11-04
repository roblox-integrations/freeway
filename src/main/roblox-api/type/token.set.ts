import {Buffer} from 'node:buffer'
import {TokenSetDto} from '@main/roblox-api/dto/token-set.dto'

export interface TokenSetParameters {
  accessToken?: string
  tokenType?: string
  idToken?: string
  refreshToken?: string
  scope?: string
  expires_at?: number
  session_state?: string
  [key: string]: unknown
}

export interface IdTokenClaims {
  sub: string // user id
  name: string
  nickname: string
  preferred_username: string
  created_at: number
  profile: string
  picture: string
  jti: string
  nbf: number
  exp: number
  iat: number
  iss: string
  aud: string
  [key: string]: unknown
}

export class TokenSet {
  accessToken: string
  tokenType: string
  idToken: string
  refreshToken: string
  expiresIn: number
  scope: string

  expiredAt?: number

  get isExpired() {
    return this.expiredAt < Math.floor(Date.now() / 1000)
  }

  get claims(): IdTokenClaims {
    if (!this.idToken) {
      throw new TypeError('idToken not present in TokenSet')
    }

    const part2 = this.idToken.split('.')[1]
    const decoded = Buffer.from(part2, 'base64').toString()
    return JSON.parse(decoded)
  }

  static fromDto(dto: TokenSetDto): TokenSet {
    const tokenSet = new TokenSet()

    tokenSet.accessToken = dto.access_token
    tokenSet.refreshToken = dto.refresh_token
    tokenSet.tokenType = dto.token_type
    tokenSet.scope = dto.scope
    tokenSet.idToken = dto.id_token

    tokenSet.expiresIn = dto.expires_in
    tokenSet.expiredAt = Math.floor(Date.now() / 1000) + dto.expires_in

    return tokenSet
  }

  static fromObject(obj: object): TokenSet {
    const tokenSet = new TokenSet()

    Object.assign(tokenSet, obj)

    return tokenSet
  }
}
