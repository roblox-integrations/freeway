import crypto from "node:crypto";
import {URL} from "node:url";
import {Injectable, Logger} from "@nestjs/common";
import {jwtDecode} from "jwt-decode";
import keytar from "keytar";
import {ConfigService} from "@nestjs/config";
import {KEYTAR_ACCOUNT, KEYTAR_SERVICE, REDIRECT_URI} from "@main/auth/auth.constants.ts";
import {ConfigurationRoblox} from "@main/_config/configuration.ts";

@Injectable()
export class AuthService {
  private accessToken: string = null;
  private refreshToken: string = null;
  private profile = null;
  private codeVerifier: string = null;
  private refreshTokenPromise: Promise<any> = null;

  private readonly logger = new Logger(AuthService.name);

  constructor(private config: ConfigService) {
  }

  async getProfile() {
    if (!this.profile) {
      if (!this.refreshTokenPromise) {
        this.refreshTokenPromise = this.refreshTokens();
      }

      await this.refreshTokenPromise
      this.refreshTokenPromise = null
    }

    return this.profile;
  }

  getClientId() {
    return this.config.get<ConfigurationRoblox>("roblox").clientId;
  }

  getAuthenticationURL(): string {
    if (!this.codeVerifier) {
      this.codeVerifier = crypto.randomBytes(32).toString('base64url');
    }

    const params = new URLSearchParams({
      client_id: this.getClientId(),
      code_challenge: crypto.createHash("sha256").update(this.codeVerifier).digest('base64url'),
      code_challenge_method: "S256",
      redirect_uri: REDIRECT_URI,
      scope: "openid profile asset:read asset:write",
      response_type: "code",
      state: 'aaaBBB211' // TODO remove this ?
    }).toString();

    return `https://apis.roblox.com/oauth/v1/authorize?${params}`;
  }

  async refreshTokens() {
    this.refreshToken = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
    const clientId = this.getClientId();

    if (this.refreshToken) {
      try {
        const input = 'https://apis.roblox.com/oauth/v1/token';
        const init = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: clientId,
            refresh_token: this.refreshToken
          })
        };

        const response = await fetch(input, init);

        if (!response.ok) {
          await this.logout();
          // console.log(await response.json())
          throw new Error(`Cannot refresh tokens. Status: ${response.status}`);
        }

        let json = await response.json()
        await this._setAuthState({responseData: json});
        return json;
      } catch (err) {
        this.logger.error(err.message);
        throw err;
      }
    }
  }

  async getAuthorizedResources() {
    try {
      const response = await fetch('https://apis.roblox.com/oauth/v1/token/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.getClientId(),
          token: this.accessToken
        })
      });

      if (!response.ok) {
        throw new Error(`Cannot get authorized resources. Status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      this.logger.error(err.message);
      throw err;
    }
  }

  async _setAuthState({responseData}: { responseData: any }) {
    this.accessToken = responseData.access_token;
    this.refreshToken = responseData.refresh_token;
    this.profile = jwtDecode(responseData.id_token);

    if (this.refreshToken) {
      await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, this.refreshToken);
    }
  }

  getCodeFromCallbackUrl(url: string) {
    const parsed = new URL(url);
    return parsed.searchParams.get("code");
  }

  async loadTokens(callbackUrl: string) {
    try {
      const code = this.getCodeFromCallbackUrl(callbackUrl);
      const clientId = this.getClientId();

      const input = 'https://apis.roblox.com/oauth/v1/token';
      const init = {
        method: "POST",
        headers: {
          "content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          code_verifier: this.codeVerifier,
          client_id: clientId
        })
      };

      const response = await fetch(input, init);

      if (!response.ok) {
        throw new Error(`Cannot load tokens. Status: ${response.status}`);
      }

      let json = await response.json()

      await this._setAuthState({responseData: json})
      this.codeVerifier = null;

      return json;
    } catch (err) {
      this.logger.error(err.message);
      await this.logout();
      throw err;
    }
  }

  async logout() {
    await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT);
    this.accessToken = null;
    this.profile = null;
    this.refreshToken = null;
    // TODO: logout from roblox?
    // TODO: invalidate refresh_token and access_token
  }
}
