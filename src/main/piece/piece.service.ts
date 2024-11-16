import {join} from 'node:path'
import process from 'node:process'
import {Window} from '@doubleshot/nest-electron'
import {PieceEventEnum, PieceStatusEnum, PieceTypeEnum} from '@main/piece/enum'
import {PieceProvider} from '@main/piece/piece.provider'
import {PieceUploadQueue} from '@main/piece/queue'
import {RobloxApiService} from '@main/roblox-api/roblox-api.service'
import {
  getMime,
  getRbxFileBase64,
  getRbxImageBitmapBase64,
  now,
} from '@main/utils'
import {Injectable, NotFoundException} from '@nestjs/common'
import {app, BrowserWindow} from 'electron'
import {UpdatePieceDto} from './dto/update-piece.dto'
import {Piece, PieceUpload} from './piece'

@Injectable()
export class PieceService {
  constructor(
      @Window() private readonly mainWin: BrowserWindow,
      private readonly robloxApiService: RobloxApiService,
      private readonly provider: PieceProvider,
      private readonly queue: PieceUploadQueue,
  ) {
    //
  }

  getAll(): Piece[] {
    return this.provider.findMany(x => !x.deletedAt)
  }

  getPieceById(id: string): Piece {
    const piece = this.provider.findOne({id})

    if (!piece) {
      throw new NotFoundException()
    }

    return piece
  }

  public async getRaw(id: string) {
    const piece = this.getPieceById(id)

    if (piece.type === PieceTypeEnum.image) {
      // return await getRbxImageBitmap255(piece.fullPath)
      // return await getRbxImageBitmap01(piece.fullPath)
      return await getRbxImageBitmapBase64(piece.fullPath)
    }

    return await getRbxFileBase64(piece.fullPath)
  }

  async queueUploadAsset(piece: Piece) {
    const upload = piece.uploads.find(x => x.hash === piece.hash)
    if (upload) {
      return
    }

    piece.status = PieceStatusEnum.queue
    this.emitEvent(PieceEventEnum.updated, piece)

    this.queue.push({
      id: piece.fullPath,
      fn: () => {
        return this.uploadAsset(piece)
      },
    })
  }

  async uploadAsset(piece: Piece) {
    let upload = piece.uploads.find(x => x.hash === piece.hash)
    if (upload) {
      // no need to upload asset actually, just update timestamp
      piece.uploadedAt = now()
      return piece
    }

    piece.status = PieceStatusEnum.upload
    this.emitEvent(PieceEventEnum.updated, piece)

    // TODO: make upload incremental - step by step, saving results on each
    const result = await this.robloxApiService.createAsset(
      piece.filePath,
      'decal',
      `Piece #${piece.id}`,
      `hash:${piece.hash}`,
    )

    upload = PieceUpload.fromObject({
      fileHash: piece.hash,
      hash: piece.hash,
      assetId: result.assetId,
      decalId: result.decalId,
      operationId: result.operationId,
    })

    piece.uploads.push(upload)
    piece.uploadedAt = now()

    piece.status = PieceStatusEnum.ok
    this.emitEvent(PieceEventEnum.updated, piece)

    await this.provider.save()

    return piece
  }

  emitEvent(name: string, data: any) {
    this.mainWin.webContents.send('ipc-message', {name, data})
  }

  async update(piece: Piece, updatePieceDto: UpdatePieceDto) {
    piece.isAutoSave = updatePieceDto.isAutoSave

    if (piece.isAutoSave) {
      await this.queueUploadAsset(piece)
    }

    this.emitEvent(PieceEventEnum.updated, piece)

    await this.provider.save()

    return piece
  }

  async delete(piece: Piece) {
    const result = this.provider.delete(piece)
    this.emitEvent(PieceEventEnum.deleted, piece)
    return result
  }

  getPiecePreviewPath(piece: Piece) {
    if (piece.type !== PieceTypeEnum.image) {
      const isDev = !app.isPackaged
      const staticDir = isDev
        ? join(__dirname, '../../static')
        : join(process.resourcesPath, 'static')

      return join(staticDir, 'preview-placeholder.png')
    }

    return piece.fullPath
  }

  getPieceMime(piece: Piece) {
    return getMime(piece.fullPath)
  }
}
