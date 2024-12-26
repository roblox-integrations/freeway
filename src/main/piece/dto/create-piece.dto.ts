import {IsBoolean, IsNumber, IsOptional, IsString} from 'class-validator'

export class CreatePieceDto {
  @IsString()
  name: string

  // @IsString()
  // dir: string

  @IsOptional()
  @IsString()
  base64: string

  @IsOptional()
  @IsNumber()
  width: number

  @IsOptional()
  @IsNumber()
  height: number

  @IsOptional()
  @IsBoolean()
  isAutoUpload: boolean
}
