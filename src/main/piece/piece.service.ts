import type {BrowserWindow} from 'electron'
import {Window} from '@doubleshot/nest-electron'
import {PieceEventEnum, PieceTypeEnum} from '@main/piece/enum'
import {PieceProvider} from '@main/piece/piece.provider'
import {RobloxApiService} from '@main/roblox-api/roblox-api.service'
import {
  getRbxFileBase64,
  getRbxImageBitmapBase64,
  now,
} from '@main/utils'
import {Injectable, NotFoundException} from '@nestjs/common'
import {UpdatePieceDto} from './dto/update-piece.dto'
import {Piece, PieceUpload} from './piece'

@Injectable()
export class PieceService {
  constructor(
      @Window() private readonly mainWin: BrowserWindow,
      private readonly robloxApiService: RobloxApiService,
      private readonly provider: PieceProvider,
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
      // return await getRbxImageBitmap255(piece.filePath)
      // return await getRbxImageBitmap01(piece.filePath)
      return await getRbxImageBitmapBase64(piece.filePath)
    }

    return await getRbxFileBase64(piece.filePath)
  }

  async uploadAsset(piece: Piece) {
    let upload = piece.uploads.find(x => x.fileHash === piece.fileHash)
    if (upload) {
      // no need to upload asset actually, just update timestamp
      piece.uploadedAt = now()
      return piece
    }

    // TODO: make upload incremental - step by step, saving results on each
    const result = await this.robloxApiService.createAsset(
      piece.filePath,
      'decal',
      `Piece #${piece.id}`,
      `hash:${piece.fileHash}`,
    )

    upload = PieceUpload.fromObject({
      fileHash: piece.fileHash,
      assetId: result.assetId,
      decalId: result.decalId,
      operationId: result.operationId,
    })

    piece.uploads.push(upload)
    piece.uploadedAt = now()

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
      // TODO: queue this action?
      await this.uploadAsset(piece)
    }

    this.emitEvent(PieceEventEnum.updated, piece)

    await this.provider.save()

    return piece
  }

  async delete(piece: Piece) {
    const result = this.provider.delete(piece)
    this.emitEvent(PieceEventEnum.deleted, piece)
    return result;
  }
}
