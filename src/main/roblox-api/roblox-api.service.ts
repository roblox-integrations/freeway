import fs from 'node:fs/promises'

import {setTimeout as delay} from 'node:timers/promises'
import {CreateAssetResultDto} from '@main/piece/dto/create-asset-result.dto'
import {RobloxOauthClient} from '@main/roblox-api/roblox-oauth.client'
import {getMime} from '@main/utils'
import {Injectable, Logger} from '@nestjs/common'
import pRetry from 'p-retry'

@Injectable()
export class RobloxApiService {
  private readonly logger = new Logger(RobloxApiService.name)

  constructor(private oauthClient: RobloxOauthClient) {
    //
  }

  async getAuthorizedResources() {
    await this.oauthClient.assertTokenSetIsValid()
    try {
      const response = await fetch('https://apis.roblox.com/oauth/v1/token/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.oauthClient.clientId,
          token: this.oauthClient.accessToken,
        }),
      })

      if (!response.ok) {
        throw new Error(`Cannot get authorized resources. Status: ${response.status}`)
      }

      return await response.json()
    }
    catch (err: any) {
      this.logger.error(err.message)
      throw err
    }
  }

  async createAssetOperationId(filePath: string, assetType = 'decal', name = 'Test name', description = 'Test description') {
    await this.oauthClient.assertTokenSetIsValid()

    const formData = new FormData()

    const request = {
      assetType,
      displayName: name,
      description,
      creationContext: {creator: {userId: this.oauthClient.userId}},
    }
    formData.append('request', JSON.stringify(request))

    const fileData = await fs.readFile(filePath)
    const type = getMime(filePath)
    formData.append('fileContent', new Blob([fileData], {type}))

    const url = 'https://apis.roblox.com/assets/v1/assets'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.oauthClient.accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      // let json = await response.json();
      throw new Error('Cannot create asset (asset operation failed)')
    }

    const json = await response.json()
    return json.operationId
  }

  async createAsset(filePath: string, assetType = 'decal', name = 'Test name', description = 'Test description'): Promise<CreateAssetResultDto> {
    try {
      const operationId = await this.createAssetOperationId(filePath, assetType, name, description)
      await delay(500)
      const decalId = await this.getAssetOperationResultRetry(operationId)
      const assetId = await this.getImageFromDecal(decalId)

      const result = CreateAssetResultDto.fromDto({assetId, decalId, operationId})
      this.logger.log(`createAsset result ${JSON.stringify(result)}`)
      return result
    }
    catch (err) {
      this.logger.error(`Cannot create asset for file ${filePath}`, err)
      throw err
    }
  }

  async getAssetOperationResultRetry(operationId: string) {
    try {
      return await pRetry(() => this.getAssetOperationResult(operationId), {
        onFailedAttempt: async (error) => {
          this.logger.log(`getAssetOperationResultRetry: Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`)
        },
        retries: 10, // 10 tries for 42 seconds
        maxTimeout: 5000,
      })
    }
    catch (err: any) {
      throw new Error(`Unable to fetch assetId in time, please try again (${err.message})`)
    }
  }

  async getAssetOperationResult(operationId: string) {
    const url = `https://apis.roblox.com/assets/v1/operations/${operationId}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.oauthClient.accessToken}`,
      },
    })

    if (!response.ok) {
      const result = await response.json()
      this.logger.error('getAssetOperationResult: error', response.status, url, result)
      throw new Error('getAssetOperationResult: error')
    }

    const operationJson = await response.json()
    if (!operationJson.done || !operationJson.response?.assetId) {
      throw new Error('getAssetOperationResult: invalid response')
    }

    return operationJson.response.assetId
  }

  async getImageFromDecal(decalId: string): Promise<string> {
    const DECAL_CAPTURE_REGEX = /<Content name="Texture">\s*<url>\D+(\d+)<\/url>\s*<\/Content>/i

    const response = await fetch(`https://assetdelivery.roblox.com/v1/asset/?id=${decalId}`)

    if (!response.ok) {
      throw new Error(`Cannot getImageFromDecal. Status: ${response.status}`)
    }

    const text = await response.text()

    const match = DECAL_CAPTURE_REGEX.exec(text)

    if (match == null) {
      throw new Error(`Cannot getImageFromDecal. Failed to get contentId from asset: ${text}`)
    }

    const imageId = Number.parseInt(match[1]) // to MAX: why?

    if (typeof imageId !== 'number') {
      throw new TypeError(`Cannot getImageFromDecal. Failed to parse image number: ${imageId}`)
    }

    return String(imageId)
  }
}
