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
import {Injectable, Logger, NotFoundException} from '@nestjs/common'
import {app, BrowserWindow} from 'electron'
import {UpdatePieceDto} from './dto/update-piece.dto'
import {Piece, PieceUpload} from './piece'

@Injectable()
export class PieceService {
  private readonly logger = new Logger(PieceService.name)
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

    this._changePieceStatus(piece, PieceStatusEnum.queue)

    this.queue.push<PieceUpload>(piece.fullPath, {
      pieceId: piece.id,
      pieceFullPath: piece.fullPath,
      run: async () => {
        this._changePieceStatus(piece, PieceStatusEnum.upload)
        return await this._uploadPiece(piece)
      },
    })
      .then((_result) => {
        piece.uploads.push(_result)
        piece.uploadedAt = now()

        this._changePieceStatus(piece, PieceStatusEnum.ok)
      })
      .catch((err) => {
        this._changePieceStatus(piece, PieceStatusEnum.error)

        this.logger.error(`Unable to upload piece #${piece.id} (file: ${piece.fullPath})`)
        this.logger.error(err)
      })
  }

  _changePieceStatus(piece: Piece, status: PieceStatusEnum) {
    piece.status = status
    this.emitEvent(PieceEventEnum.updated, piece)
  }

  findCurrentUpload(piece: Piece) {
    return piece.uploads.find(x => x.hash === piece.hash)
  }

  async uploadAsset(piece: Piece) {
    let upload = this.findCurrentUpload(piece)
    if (upload) {
      return piece
    }

    piece.status = PieceStatusEnum.upload
    this.emitEvent(PieceEventEnum.updated, piece)

    upload = await this._uploadPiece(piece)

    piece.uploads.push(upload)
    piece.uploadedAt = now()

    piece.status = PieceStatusEnum.ok
    this.emitEvent(PieceEventEnum.updated, piece)

    await this.provider.save()

    return piece
  }

  private async _uploadPiece(piece: Piece): Promise<PieceUpload> {
    // TODO: make upload incremental - step by step, saving results on each
    const result = await this.robloxApiService.createAsset(
      piece.fullPath,
      'decal',
      `Piece #${piece.id}`,
      `hash:${piece.hash}`,
    )

    return PieceUpload.fromObject({
      hash: piece.hash,
      assetId: result.assetId,
      decalId: result.decalId,
      operationId: result.operationId,
    })
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
