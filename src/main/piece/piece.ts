import {PieceTypeEnum} from "./piece-type.enum.ts";
import {PieceRoleEnum} from "./piece-role.enum.ts";

export class Piece {
  constructor (
    public id: string,
    public role: PieceRoleEnum, //: "asset|editable", // tbd: support EditableImage/EditableMesh where possible
    public type: PieceTypeEnum, //: "image|mesh|meshtexturepack", // or tbd mesh+texture pack
    public filePath: string,//: "artpiece.png"
    public fileHash: string, // md5 of piece
    public assetIds: string[] = [], //: [1, 2, 3, 4, 5, 6], // history of asset ids, the last one is the current
    public updatedAt: number = null,
    public deletedAt: number = null,

    public isDirty: boolean = true,
  ) {
    this.id = id;
    this.role = role;
    this.type = type;
    this.fileHash = fileHash;
    this.filePath = filePath;
    this.assetIds = assetIds;

    if (!this.updatedAt) {
      this.touch();
    }
  }

  touch () {
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  toJSON(){
    const {isDirty, ...object} = this;
    return object;
  }
}
