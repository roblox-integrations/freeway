import {PieceRoleEnum, PieceTypeEnum} from "./enum";
import {now} from "@main/utils";

export interface PieceSnapshot {
  assetId: string,
  fileHash: string,
  operationId?: string,
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

  static createFromObject (obj: Piece) {
    return new Piece(
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
  }
}

export class PieceEditable extends Piece {
  public data: any;
}
