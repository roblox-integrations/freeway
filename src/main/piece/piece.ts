import {PieceTypeEnum, PieceRoleEnum} from "./enum";
import {now} from "@main/piece/utils.ts";
import {lookup} from 'mime-types';

export interface PieceSnapshot {
  assetId: string,
  fileHash: string,
}

export class Piece {
  constructor(
    public id: string,
    public role: PieceRoleEnum,
    public type: PieceTypeEnum,
    public filePath: string,
    public fileHash: string = '',
    public assetIds: PieceSnapshot[] = [],
    public isAutoSave: boolean = false,
    public updatedAt: number = null,
    public deletedAt: number = null,
    public isDirty: boolean = true,
  ) {
    if (!this.updatedAt) {
      this.updatedAt = now();
    }
  }

  toJSON() {
    const {isDirty, ...object} = this;
    return object;
  }

  get mimeType(): string {
    return lookup(this.filePath) || 'application/octet-stream';
  }

  static createFromObject (obj: Piece) {
    const piece = new Piece(
      obj.id,
      obj.role,
      obj.type,
      obj.filePath,
      obj.fileHash,
      obj.assetIds,
      obj.isAutoSave,
      obj.updatedAt,
      obj.deletedAt
    );
    return piece;
  }
}

export class PieceEditable extends Piece {
  public data: any;
}
