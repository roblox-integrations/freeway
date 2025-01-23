import {PieceLinkService} from '@main/piece/piece-link.service'
import {RobloxApiModule} from '@main/roblox-api/roblox-api.module'
import {Module} from '@nestjs/common'
import {PieceNotificationService} from './piece-notification.service'
import {PieceUploadService} from './piece-upload.service'
import {PieceController} from './piece.controller'
import {PieceProvider} from './piece.provider'
import {PieceService} from './piece.service'
import {PieceUploadQueue, PieceWatcherQueue} from './queue'
import {PieceWatcher} from './watcher'

@Module({
  providers: [
    PieceProvider,
    PieceUploadService,
    PieceNotificationService,
    PieceUploadQueue,
    PieceWatcherQueue,
    PieceLinkService,
    PieceService,
    PieceWatcher,
  ],
  controllers: [PieceController],
  imports: [RobloxApiModule],
  exports: [PieceService],
})
export class PieceModule {}
