import {PieceProvider} from '@main/piece/piece.provider'
import {PieceNotificationService} from '@main/piece/piece-notification.service'
import {PieceUploadQueue, PieceWatcherQueue} from '@main/piece/queue'
import {PieceWatcher} from '@main/piece/watcher'
import {RobloxApiModule} from '@main/roblox-api/roblox-api.module'
import {Module} from '@nestjs/common'
import {PieceController} from './piece.controller'
import {PieceService} from './piece.service'

@Module({
  providers: [
    PieceProvider,
    PieceService,
    PieceNotificationService,
    PieceUploadQueue,
    PieceWatcherQueue,
    PieceWatcher,
  ],
  controllers: [PieceController],
  imports: [RobloxApiModule],
  exports: [PieceService],
})
export class PieceModule {}
