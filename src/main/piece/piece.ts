import {PieceTypeEnum, PieceRoleEnum} from "./enum";
import {now} from "@main/piece/utils.ts";

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
    public fileHash: string,
    public assetIds: PieceSnapshot[] = [],
    public updatedAt: number = null,
    public deletedAt: number = null,
    public isDirty: boolean = true,
    public isAutoSave: boolean = false,
  ) {
    if (!this.updatedAt) {
      this.updatedAt = now();
    }
  }

  toJSON() {
    const {isDirty, ...object} = this;
    return object;
  }
}

export class PieceEditable extends Piece {
  public data: any;
}
