import {IsString} from 'class-validator'

export class UpsertPieceUploadDto {
  @IsString()
  hash: string

  @IsString()
  assetId: string
}
