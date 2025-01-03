import {join, parse} from 'node:path'
import process from 'node:process'
import {Window} from '@doubleshot/nest-electron'
import {ConfigurationPiece} from '@main/_config/configuration'
import {CreatePieceDto, UpdatePieceDto} from '@main/piece/dto'
import {UpsertPieceUploadDto} from '@main/piece/dto/upsert-piece-upload.dto'
import {PieceEventEnum, PieceRoleEnum, PieceStatusEnum, PieceTypeEnum} from '@main/piece/enum'
import {PieceProvider} from '@main/piece/piece.provider'
import {PieceUploadQueue} from '@main/piece/queue'
import {RobloxApiService} from '@main/roblox-api/roblox-api.service'
import {
  getMime,
  getRbxFileBase64,
  getRbxImageBitmapBase64,
  getRbxMeshBase64,
  now,
  RbxBase64File,
  RbxBase64Image,
  writeRbxFile,
  writeRbxImage,
} from '@main/utils'
import {Injectable, Logger, NotFoundException, UnprocessableEntityException} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {EventEmitter2} from '@nestjs/event-emitter'
import {app, BrowserWindow} from 'electron'
import fse from 'fs-extra'
import {temporaryFile} from 'tempy'
import {Piece, PieceUpload} from './piece'

@Injectable()
export class PieceService {
  private readonly logger = new Logger(PieceService.name)
  private readonly options: ConfigurationPiece

  constructor(
      @Window() private readonly mainWin: BrowserWindow,
      private readonly robloxApiService: RobloxApiService,
      private readonly provider: PieceProvider,
      private readonly queue: PieceUploadQueue,
      private readonly eventEmitter: EventEmitter2,
      private readonly config: ConfigService,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')
  }

  findMany(criteria: any): Piece[] {
    return this.provider.findMany(criteria)
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

    if (piece.type === PieceTypeEnum.mesh) {
      return await getRbxMeshBase64(piece.fullPath)
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
        this.emitEvent(PieceEventEnum.uploaded, piece)
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

    this._changePieceStatus(piece, PieceStatusEnum.upload)

    upload = await this._uploadPiece(piece)

    piece.uploads.push(upload)
    piece.uploadedAt = now()

    this._changePieceStatus(piece, PieceStatusEnum.ok)

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
    this.eventEmitter.emit(name, data)
    this.mainWin.webContents.send('ipc-message', {name, data})
  }

  async create(dto: CreatePieceDto) {
    const name = dto.name
    const dir = this.options.watchDirectory

    const piece = await this.provider.create(dir, name, PieceRoleEnum.virtual)

    if (dto.base64) {
      try {
        await this.createPieceFileBase64(piece, dto)
        piece.role = PieceRoleEnum.asset
      }
      catch (err: any) {
        this.logger.error('Unable to write piece file', err)
        await this.provider.hardDelete(piece) // revert back, delete created piece
        throw new UnprocessableEntityException(`Unable to write piece file (${err.message})`)
      }
    }

    if (piece.isAutoUpload) {
      await this.queueUploadAsset(piece)
    }

    this.emitEvent(PieceEventEnum.created, piece)

    return piece
  }

  async createPieceFileBase64(piece: Piece, dto: RbxBase64Image | RbxBase64File) {
    if (piece.type === PieceTypeEnum.image) {
      const parsed = parse(piece.name)
      const file = temporaryFile({name: parsed.base})
      await writeRbxImage(dto as RbxBase64Image, file)
      await fse.move(file, join(piece.dir, piece.name)) // move from temp file to actual file
    }
    else if (piece.type === PieceTypeEnum.mesh) {
      const parsed = parse(piece.name)
      const file = temporaryFile({name: parsed.base})
      await writeRbxFile(dto, file)
      await fse.move(file, join(piece.dir, piece.name)) // move from temp file to actual file
    }
    else {
      throw new UnprocessableEntityException(`Create piece file is not supported for given type ${piece.type}`)
    }
  }

  async update(piece: Piece, dto: UpdatePieceDto) {
    if (dto.isAutoUpload !== undefined) {
      piece.isAutoUpload = dto.isAutoUpload
    }

    if (dto.base64) {
      try {
        await this.updatePieceFileBase64(piece, dto)
        piece.role = PieceRoleEnum.asset
      }
      catch (err: any) {
        this.logger.error('Unable to write piece file', err)
        throw new UnprocessableEntityException(`Unable to write piece file (${err.message})`)
      }
    }

    if (piece.isAutoUpload) {
      await this.queueUploadAsset(piece)
    }

    this.emitEvent(PieceEventEnum.updated, piece)

    await this.provider.save()

    return piece
  }

  async updatePieceFileBase64(piece: Piece, dto: RbxBase64Image | RbxBase64File) {
    const destFile = join(piece.dir, piece.name)
    if (piece.type === PieceTypeEnum.image) {
      await writeRbxImage(dto as RbxBase64Image, destFile)
    }
    else if (piece.type === PieceTypeEnum.mesh) {
      await writeRbxFile(dto, destFile)
    }
    else {
      throw new UnprocessableEntityException(`Update piece file is not supported for given type ${piece.type}`)
    }
  }

  async upsertUpload(piece: Piece, dto: UpsertPieceUploadDto) {
    const upload = piece.uploads.find(x => x.hash === dto.hash)
    if (upload) {
      upload.assetId = dto.assetId
    }
    else {
      piece.uploads.push({assetId: dto.assetId, hash: dto.hash})
    }

    this.emitEvent(PieceEventEnum.updated, piece)

    await this.provider.save()

    return piece
  }

  async delete(piece: Piece) {
    const result = await this.provider.delete(piece)
    this.emitEvent(PieceEventEnum.deleted, piece)
    await this.provider.save()
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
