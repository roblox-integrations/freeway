import {now} from '@main/utils'
import {PartialType} from '@nestjs/mapped-types'
import {PieceRoleEnum, PieceTypeEnum} from './enum'

export class PieceUpload {
  public hash: string
  public fileHash: string // deprecated
  public assetId: string
  public decalId: string
  public operationId?: string

  constructor() {
    //
  }

  static fromObject(obj: CreatePieceUploadDto) {
    const piece = new PieceUpload()
    Object.assign(piece, obj)
    return piece
  }
}

export class CreatePieceUploadDto extends PartialType(PieceUpload) {
  //
}

export class Piece {
  public id: string
  public role: PieceRoleEnum
  public type: PieceTypeEnum
  public dir: string
  public name: string
  public filePath: string // deprecated
  public hash: string = ''
  public fileHash: string = '' // deprecated
  public uploads: PieceUpload[] = []
  public isAutoSave: boolean = false
  public updatedAt: number = null
  public deletedAt: number = null
  public uploadedAt: number = null
  public isDirty: boolean = true
  public get fullPath() {
    return `${this.dir}/${this.name}`
  }

  constructor() {
    if (!this.updatedAt) {
      this.updatedAt = now()
    }
  }

  toJSON() {
    const {isDirty, ...object} = this
    return object
  }

  static fromObject(obj: CreatePieceDto) {
    const piece = new Piece()
    Object.assign(piece, obj)

    if (piece.fileHash) {
      piece.hash = piece.fileHash
    }

    if (piece.uploads?.length > 0) {
      piece.uploads.forEach((upload) => {
        upload.hash = upload.fileHash // deprecated
      })
    }

    return piece
  }
}

export class CreatePieceDto extends PartialType(Piece) {
  //
}

export class PieceEditable extends Piece {
  public data: any
}

/*
class Entry {
  id: string;
  file: EntryFile;
  assets: EntryAsset[];
  assetedAt: number;
  deletedAt: number;
}

class EntryFile {
  hash: string;
  path: string;
}

class EntryAsset {
  hash: string;
  operationId: string;
  decalId: string;
  assetId: string;
}
*/
