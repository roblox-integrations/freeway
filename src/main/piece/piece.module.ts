import { PIECE_OPTIONS } from '@main/piece/constants.ts'
import { PieceModuleOptions } from '@main/piece/piece.module.options.ts'
import { DynamicModule, Module } from '@nestjs/common'
import { PieceController } from './piece.controller'
import { PieceService } from './piece.service'
import {ensureDir} from 'fs-extra'

@Module({})
export class PieceModule {
  static registerAsync(options: PieceModuleOptions): DynamicModule {
    const pieceServiceInstanceProviderName = `${PieceService.name}Instance`

    return {
      global: options.isGlobal,
      module: PieceModule,
      controllers: [PieceController],
      providers: [
        {
          provide: PIECE_OPTIONS,
          useValue: options,
        },
        {
          provide: pieceServiceInstanceProviderName,
          useClass: PieceService,
        },
        {
          provide: PieceService,
          useFactory: async (pieceService: PieceService, options: PieceModuleOptions) => {
            await ensureDir(options.defaultWatchPath)
            await pieceService.init();
            return pieceService;
          },
          inject: [pieceServiceInstanceProviderName, PIECE_OPTIONS]
        },
      ],
      exports: [PieceService],
    }
  }
}
