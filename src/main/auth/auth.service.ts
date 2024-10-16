import crypto from "node:crypto";
import {URL} from "node:url";
import fs from "node:fs/promises";
import {Injectable, Logger} from "@nestjs/common";
import {jwtDecode} from "jwt-decode";
import keytar from "keytar";
import {ConfigService} from "@nestjs/config";
import {KEYTAR_ACCOUNT, KEYTAR_SERVICE, REDIRECT_URI} from "@main/auth/auth.constants.ts";
import {ConfigurationRoblox} from "@main/_config/configuration.ts";
import {ProfileOauthDto, ProfileDto} from "@main/auth/dto";
import {Piece} from "@main/piece/piece.ts";
import {setTimeout as delay} from 'timers/promises';
import {default as pRetry} from 'p-retry'


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

  async getProfile(): Promise<ProfileDto> {
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
    const decoded = jwtDecode(responseData.id_token) as ProfileOauthDto;
    this.profile = ProfileDto.createFromProfileOAuthDto(decoded);

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

  async createAssetOperationId(piece: Piece) {
    const profile = await this.getProfile();
    const userId = profile.id;

    const formData = new FormData()

    const request = {
      assetType: "decal",
      displayName: `Piece #${piece.id}`,
      description: "test description",
      creationContext: {creator: {userId: userId}}
    }
    formData.append('request', JSON.stringify(request))

    let fileData = await fs.readFile(piece.filePath);
    formData.append('fileContent', new Blob([fileData], {type: piece.mimeType}));

    let url = 'https://apis.roblox.com/assets/v1/assets'
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: formData
    })

    if (!response.ok) {
      // let json = await response.json();
      throw new Error('Cannot create asset (asset operation failed)')
    }

    const json = await response.json()
    return json.operationId;
  }

  async createAsset(piece: Piece) {
    try {
      let operationId = await this.createAssetOperationId(piece);
      await delay(500);
      const resultingAssetId = await this.getAssetOperationResultRetry(operationId)
      const imageAssetId = await this.getImageFromDecal(resultingAssetId)
      this.logger.log(imageAssetId)
      return imageAssetId
    } catch (err) {
      this.logger.error("Cannot create asset for Piece", err);
      throw err;
    }
  }

  async getAssetOperationResultRetry(operationId: string) {
    try {
      return await pRetry(() => this.getAssetOperationResult(operationId), {
        retries: 10,
        onFailedAttempt: async (error) => {
          this.logger.log(`getAssetOperationResultRetry: Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`);
        },
        // @see https://github.com/tim-kos/node-retry
        // formula: backoff = Math.min(random * minTimeout * Math.pow(factor, attempt), maxTimeout)
        factor: 1.2,
        minTimeout: 400,
      })
    }
    catch (err) {
      throw new Error("Unable to fetch assetid in time, please try again")
    }
  }

  async getAssetOperationResult(operationId: string) {
    const url = `https://apis.roblox.com/assets/v1/operations/${operationId}`
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    })

    if (!response.ok) {
      const result = await response.json();
      this.logger.error('getAssetOperationResult: not OK', response.status, url, result)
      throw new Error('getAssetOperationResult: not OK');
    }

    let operationJson = await response.json()
    if (!operationJson.done || !operationJson.response?.assetId) {
      throw new Error('getAssetOperationResult: invalid response');
    }

    return operationJson.response.assetId;
  }

  async getImageFromDecal(decalId: string): Promise<number> {
    const DECAL_CAPTURE_REGEX = new RegExp('<Content name="Texture">\\s*<url>[^0-9]+(\\d+)</url>\\s*</Content>');

    let response = await fetch(`https://assetdelivery.roblox.com/v1/asset/?id=${decalId}`)

    if (!response.ok) {
      throw new Error(`Cannot getImageFromDecal. Status: ${response.status}`)
    }

    let text = await response.text()

    const match = DECAL_CAPTURE_REGEX.exec(text);

    if (match == null) {
      throw new Error(`Cannot getImageFromDecal. Failed to get contentId from asset: ${text}`);
    }

    const imageId = parseInt(match[1]);

    if (typeof imageId !== 'number') {
      throw new Error(`Cannot getImageFromDecal. Failed to parse image number: ${imageId}`);
    }

    return imageId;
  }
}

