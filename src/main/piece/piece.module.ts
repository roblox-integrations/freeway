import {PIECE_OPTIONS} from '@main/piece/constants.ts'
import {PieceModuleOptions} from '@main/piece/piece.module.options.ts'
import {PieceParcelWatcher, PieceWatcher} from '@main/piece/watcher'
import {RobloxApiModule} from '@main/roblox-api/roblox-api.module.ts'
import {DynamicModule, Module} from '@nestjs/common'
import {PieceController} from './piece.controller'
import {PieceService} from './piece.service'

@Module({})
export class PieceModule {
  static registerAsync(options: PieceModuleOptions): DynamicModule {
    return {
      global: options.isGlobal,
      module: PieceModule,
      controllers: [PieceController],
      providers: [
        {
          provide: PIECE_OPTIONS,
          useValue: options,
        },
        PieceService,
        {
          provide: PieceWatcher,
          useClass: PieceParcelWatcher,
        },
      ],
      imports: [RobloxApiModule],
      exports: [PieceService],
    }
  }
}
