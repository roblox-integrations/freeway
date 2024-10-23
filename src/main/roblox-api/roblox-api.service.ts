import {Injectable, Logger} from '@nestjs/common';

import fs from "node:fs/promises";
import {getMime} from "@main/utils";
import {setTimeout as delay} from "timers/promises";
import {default as pRetry} from "p-retry";
import {RobloxOauthClient} from "@main/roblox-api/roblox-oauth.client.ts";

@Injectable()
export class RobloxApiService {
  private readonly logger = new Logger(RobloxApiService.name);

  constructor(private oauthClient: RobloxOauthClient) {
    //
  }

  async getAuthorizedResources() {
    await this.oauthClient.assertTokenSetIsValid();
    try {
      const response = await fetch('https://apis.roblox.com/oauth/v1/token/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.oauthClient.clientId,
          token: this.oauthClient.accessToken
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

  async createAssetOperationId(filePath: string, assetType = "decal", name = "Test name", description = "Test description") {
    await this.oauthClient.assertTokenSetIsValid();

    const formData = new FormData()

    const request = {
      assetType,
      displayName: name,
      description: description,
      creationContext: {creator: {userId: this.oauthClient.userId}}
    }
    formData.append('request', JSON.stringify(request));

    const fileData = await fs.readFile(filePath);
    const type = getMime(filePath);
    formData.append('fileContent', new Blob([fileData], {type}));

    let url = 'https://apis.roblox.com/assets/v1/assets'
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.oauthClient.accessToken}`,
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

  async createAsset(filePath: string, assetType = "decal", name = "Test name", description = "Test description") {
    try {
      let operationId = await this.createAssetOperationId(filePath, assetType, name, description);
      await delay(500);
      const decalId = await this.getAssetOperationResultRetry(operationId)
      const assetId = await this.getImageFromDecal(decalId)
      this.logger.log(assetId)
      return {assetId, decalId, operationId}
    } catch (err) {
      this.logger.error(`Cannot create asset for file ${filePath}`, err);
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
    } catch (err) {
      throw new Error("Unable to fetch assetId in time, please try again")
    }
  }

  async getAssetOperationResult(operationId: string) {
    const url = `https://apis.roblox.com/assets/v1/operations/${operationId}`
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.oauthClient.accessToken}`,
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

  async getImageFromDecal(decalId: string): Promise<string> {
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

    const imageId = parseInt(match[1]); // to MAX: why?

    if (typeof imageId !== 'number') {
      throw new Error(`Cannot getImageFromDecal. Failed to parse image number: ${imageId}`);
    }

    return String(imageId)
  }
}
