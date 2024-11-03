export interface GrantTypeRefreshToken extends Record<string, string | readonly string[]> {
  client_id: string
  grant_type: 'refresh_token'
  refresh_token: string
}

export interface GrantTypeAuthorizationCode extends Record<string, string | readonly string[]> {
  client_id: string
  grant_type: 'authorization_code'
  code: string
  code_verifier: string
}

export type GrantType = GrantTypeRefreshToken | GrantTypeAuthorizationCode
