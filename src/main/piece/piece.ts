import {PieceTypeEnum} from "./piece-type.enum.ts";
import {PieceRoleEnum} from "./piece-role.enum.ts";
import {getHash} from "./utils.ts";

export class Piece {
  constructor (
    public id: string,
    public role: PieceRoleEnum, //: "asset|editable", // tbd: support EditableImage/EditableMesh where possible
    public type: PieceTypeEnum, //: "image|mesh|meshtexturepack", // or tbd mesh+texture pack
    public filePath: string,//: "artpiece.png"
    public fileHash: string, // md5 of piece
    public assetIds: string[] = [], //: [1, 2, 3, 4, 5, 6], // history of asset ids, the last one is the current
    public updatedAt: number = null,
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

  static fromObject (object: any): Piece {
    return new Piece(
      object.id,
      object.role,
      object.type,
      object.filePath,
      object.fileHash,
      object.assetIds,
      object.updatedAt
    )
  }

  static async fromFile (filePath: string, role = PieceRoleEnum.asset, type = PieceTypeEnum.image) {
    const hash = await getHash(filePath) // TODO need? pretty complex for CPU/Disk IO
    const id = `ts-${Date.now()}` // TODO better uuid
    return new Piece(id, role, type, filePath, hash)
  }
}
