import type {BrowserWindow} from 'electron'
import type {PieceModuleOptions} from './piece.module.options'
import fs from 'node:fs/promises'
import {parse} from 'node:path'
import {Window} from '@doubleshot/nest-electron'
import {PieceEventEnum, PieceExtTypeMap, PieceRoleEnum, PieceTypeEnum} from '@main/piece/enum'
import {RobloxApiService} from '@main/roblox-api/roblox-api.service'
import {
  getHash,
  getRbxFileBase64,
  getRbxImageBitmap01,
  getRbxImageBitmap255,
  getRbxImageBitmapBase64,
  now,
  randomString,
} from '@main/utils'
import {Inject, Injectable, Logger, UnprocessableEntityException} from '@nestjs/common'
import {UpdatePieceDto} from './dto/update-piece.dto'
import {Piece, PieceEditable, PieceUpload} from './piece'
import {PIECE_OPTIONS} from './piece.constants'

@Injectable()
export class PieceService {
  private readonly logger = new Logger(PieceService.name)
  private readonly data: Piece[] = []

  constructor(@Inject(PIECE_OPTIONS) private options: PieceModuleOptions, @Window() private readonly mainWin: BrowserWindow, private readonly robloxApiService: RobloxApiService) {
    //
  }

  async load() {
    try {
      await fs.access(this.options.metadataPath)
    }
    catch (accessErr: any) {
      if (accessErr.code === 'ENOENT') {
        await fs.writeFile(this.options.metadataPath, '[]') // create empty-array file
      }
      else {
        throw accessErr
      }
    }

    let data = null
    try {
      data = await fs.readFile(this.options.metadataPath, {encoding: 'utf8'})
      data = data || '[]'
    }
    catch (readErr) {
      console.error(readErr)
      throw new Error(`File ${this.options.metadataPath} does not exist`)
    }

    try {
      data = JSON.parse(data)
    }
    catch (parseErr) {
      console.error(parseErr)
      throw new Error(`Cannot parse JSON file ${this.options.metadataPath}`)
    }

    if (Array.isArray(data)) {
      for (const x of data) {
        this.data.push(Piece.fromObject(x))
      }
    }
    else {
      throw new TypeError('Invalid metadata format')
    }
  }

  async _write(): Promise<void> {
    try {
      const data = JSON.stringify(this.data, null, 2)
      await fs.writeFile(this.options.metadataPath, data, {encoding: 'utf8', flush: true})
    }
    catch (writeErr) {
      console.error(writeErr)
      throw new Error(`File ${this.options.metadataPath} cannot write file`)
    }
  }

  async flush(): Promise<void> {
    return this._write()
  }

  getAll(): Piece[] {
    return this.data.filter(x => !x.deletedAt)
  }

  getPiece(filePath: string): Piece | undefined {
    return this.data.find(x => x.filePath === filePath)
  }

  getPieceById(id: string): Piece {
    return this.data.find(x => x.id === id)
  }

  public async getPieceByIdDumped(id: string) {
    const piece = this.getPieceById(id) as PieceEditable
    piece.data = await this.getDump(piece)
    return piece
  }

  public async getPieceByIdBase64(id: string) {
    const piece = this.getPieceById(id) as PieceEditable

    if (piece.type === PieceTypeEnum.image) {
      // return await getRbxImageBitmap255(piece.filePath)
      // return await getRbxImageBitmap01(piece.filePath)
      return await getRbxImageBitmapBase64(piece.filePath)
    }

    return await getRbxFileBase64(piece.filePath)
  }

  public async getDump(piece: Piece) {
    return await getRbxFileBase64(piece.filePath)
  }

  add(piece: Piece): void {
    this.data.push(piece)
  }

  removePiece(piece: Piece): void {
    piece.deletedAt = now()
  }

  async createFromFile(filePath: string, role = PieceRoleEnum.asset) {
    const id = this.generateUniqId()
    const fileHash = await getHash(filePath)
    const parsed = parse(filePath)
    const type = PieceExtTypeMap.get(parsed.ext) || PieceTypeEnum.unknown as PieceTypeEnum
    const isDirty = false

    return Piece.fromObject({id, role, type, filePath, fileHash, isDirty})
  }

  async addFromFile(filePath: string) {
    const newPiece = await this.createFromFile(filePath)
    this.add(newPiece)

    return newPiece
  }

  async updateFromFile(piece: Piece) {
    piece.isDirty = false
    piece.deletedAt = null

    const hash = await getHash(piece.filePath)
    if (hash !== piece.fileHash) {
      piece.fileHash = hash
      piece.updatedAt = now()
    }

    return piece
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

    return piece
  }

  emitEvent(name: string, data: any) {
    this.mainWin.webContents.send('ipc-message', {name, data})
  }

  private generateUniqId() {
    for (let i = 0; ; i++) {
      const id = randomString(Math.floor(i / 10 + 4))
      if (!this.getPieceById(id)) {
        return id
      }
    }
  }

  async update(piece: Piece, updatePieceDto: UpdatePieceDto) {
    piece.isAutoSave = updatePieceDto.isAutoSave

    if (piece.isAutoSave) {
      // TODO: queue this action?
      await this.uploadAsset(piece)
    }

    this.emitEvent(PieceEventEnum.updated, piece)

    return piece
  }

  async delete(piece: Piece) {
    try {
      await fs.unlink(piece.filePath)
      const pos = this.data.indexOf(piece)
      if (pos !== -1) {
        this.data.splice(pos, 1)
      }
      this.emitEvent(PieceEventEnum.deleted, piece)
      return null
    }
    catch (err) {
      this.logger.error(`Error deleting piece: ${piece.fileHash}`, err)
      throw new UnprocessableEntityException(err)
    }
  }
}
