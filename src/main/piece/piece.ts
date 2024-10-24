import {PieceRoleEnum, PieceTypeEnum} from "./enum";
import {now} from "@main/utils";
import {PartialType} from '@nestjs/mapped-types';


export class PieceUpload {
  public fileHash: string
  public assetId: string
  public decalId: string
  public operationId?: string

  constructor() {
    //
  }

  static fromObject(obj: CreatePieceUploadDto) {
    const piece = new PieceUpload();
    Object.assign(piece, obj);
    return piece;
  }
}

export class CreatePieceUploadDto extends PartialType(PieceUpload) {
  //
}

export class Piece {
  public id: string
  public role: PieceRoleEnum
  public type: PieceTypeEnum
  public filePath: string
  public fileHash: string = ''
  public uploads: PieceUpload[] = []
  public isAutoSave: boolean = false
  public updatedAt: number = null
  public deletedAt: number = null
  public uploadedAt: number = null
  public isDirty: boolean = true

  constructor() {
    if (!this.updatedAt) {
      this.updatedAt = now();
    }
  }

  toJSON() {
    const {isDirty, ...object} = this;
    return object;
  }

  static fromObject(obj: CreatePieceDto) {
    const piece = new Piece();
    Object.assign(piece, obj);
    return piece;
  }
}

export class CreatePieceDto extends PartialType(Piece) {
  //
}

export class PieceEditable extends Piece {
  public data: any;
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
