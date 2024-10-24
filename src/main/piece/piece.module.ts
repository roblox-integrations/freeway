import {PIECE_OPTIONS} from '@main/piece/constants.ts'
import {PieceModuleOptions} from '@main/piece/piece.module.options.ts'
import {DynamicModule, Module} from '@nestjs/common'
import {PieceController} from './piece.controller'
import {PieceService} from './piece.service'
import {PieceWatcher} from "@main/piece/piece.watcher.ts"
import {RobloxApiModule} from "@main/roblox-api/roblox-api.module.ts";

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
        PieceWatcher,
      ],
      imports: [RobloxApiModule],
      exports: [PieceService],
    }
  }
}
