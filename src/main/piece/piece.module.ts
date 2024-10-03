import { PIECE_OPTIONS } from '@main/piece/constants.ts'
import { PieceModuleOptions } from '@main/piece/piece.module.options.ts'
import { DynamicModule, Module } from '@nestjs/common'
import { PieceController } from './piece.controller'
import { PieceService } from './piece.service'

@Module({})
export class PieceModule {
  static register(options: PieceModuleOptions): DynamicModule {
    return {
      module: PieceModule,
      controllers: [PieceController],
      providers: [
        {
          provide: PIECE_OPTIONS,
          useValue: options,
        },
        PieceService,
      ],
      exports: [PieceService],
    }
  }
}
