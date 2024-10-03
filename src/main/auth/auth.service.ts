import crypto from "node:crypto";
import os from "node:os";
import url from "node:url";
import {Injectable} from "@nestjs/common";
import axios from "axios";
import {jwtDecode} from "jwt-decode";
import keytar from "keytar";
import {ConfigService} from "@nestjs/config";

const redirectUri = "http://localhost:3000/oauth/callback";

const keytarService = "roblox-integration-hub";
const keytarAccount = os.userInfo().username;

// store this value in the service
let accessToken = null;
let profile = null;
let refreshToken = null;
// create a random code verifier
const code_verifier = base64URLEncode(crypto.randomBytes(32));
// generate a challenge from the code verifier
const code_challenge = base64URLEncode(sha256(code_verifier));
const state = "aaaBBB211";

@Injectable()
export class AuthService {
  constructor(private config: ConfigService) {
  }

  getAccessToken() {
    return accessToken;
  }

  async getProfile() {
    if (!profile) {
      await this.refreshTokens();
    }
    return profile;
  }

  getClientId() {
    return this.config.get("roblox.clientId");
  }

  getAuthenticationURL() {
    const params = `${new URLSearchParams({
      client_id: this.getClientId(),
      code_challenge,
      code_challenge_method: "S256",
      redirect_uri: redirectUri,
      scope: "openid profile asset:read asset:write",
      response_type: "code",
      state
    }).toString()}`;

    return `https://apis.roblox.com/oauth/v1/authorize?${params}`;
  }

  async refreshTokens() {
    const storedRefreshToken = await keytar.getPassword(keytarService, keytarAccount);

    if (storedRefreshToken) {
      const data = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.getClientId(),
        refresh_token: storedRefreshToken
      });

      const refreshOptions = {
        method: "POST",
        url: `https://apis.roblox.com/oauth/v1/token`,
        headers: {
          "content-Type": "application/x-www-form-urlencoded"
        },
        data
      };

      try {
        const response = await axios(refreshOptions);
        await this._setAuthState({responseData: response.data});
      }
      catch (error) {
        await this.logout();
        throw error;
      }
    }
    else {
      throw new Error("No available refresh token.");
    }
  }

  async _setAuthState({responseData}: { responseData: any }) {
    accessToken = responseData.access_token;
    refreshToken = responseData.refresh_token;
    profile = jwtDecode(responseData.id_token);

    if (refreshToken) {
      await keytar.setPassword(keytarService, keytarAccount, refreshToken);
    }
  }

  async loadTokens(callbackURL: string) {
    const urlParts = new url.URL(callbackURL);
    const code = urlParts.searchParams.get("code");
    const data = new URLSearchParams({
      code,
      code_verifier,
      grant_type: "authorization_code",
      client_id: this.getClientId()
    });

    const options = {
      method: "POST",
      url: `https://apis.roblox.com/oauth/v1/token`,
      headers: {
        "content-Type": "application/x-www-form-urlencoded"
      },
      data
    };

    try {
      const response = await axios(options);
      await this._setAuthState({responseData: response.data});
    }
    catch (error) {
      await this.logout();
      throw error;
    }
  }

  async logout() {
    await keytar.deletePassword(keytarService, keytarAccount);
    accessToken = null;
    profile = null;
    refreshToken = null;
    // TODO: logout from roblox?
    // TODO: invalidate refresh_token and access_token
  }

  getLogOutUrl() {
    // TODO: wrong url
    return `https://roblox.com/logout`;
  }
}

// base64URL encode the verifier and challenge
function base64URLEncode(str) {
  return str.toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// create sha256 hash from code verifier
function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest(`base64`);
}
