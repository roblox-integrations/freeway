// import { PartialType } from '@nestjs/mapped-types';
// import { CreatePieceDto } from './create-piece.dto.ts';
// export class UpdatePieceDto extends PartialType(CreatePieceDto) {}

import {IsBoolean} from 'class-validator';

export class UpdatePieceDto {
  @IsBoolean()
  isAutoSave: boolean;
}
