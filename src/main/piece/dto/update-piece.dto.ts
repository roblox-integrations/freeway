// import { PartialType } from '@nestjs/mapped-types';
// import { CreatePieceDto } from './create-piece.dto';
// export class UpdatePieceDto extends PartialType(CreatePieceDto) {}

import {IsBoolean, IsNumber, IsOptional, IsString} from 'class-validator'

export class UpdatePieceDto {
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
