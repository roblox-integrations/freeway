import {Operation} from '@common/queue/PBetterQueue'
import {ConfigurationPiece} from '@main/_config/configuration'
import {Injectable} from '@nestjs/common'
import {BaseOptions, BasePayload, BaseQueue} from './base.queue'

export type PieceWatcherQueueTask = {
  id: string
  filePath: string // deprecated
  dir: string
  name: string
} & BasePayload<PieceWatcherQueueTask>

@Injectable()
export class PieceWatcherQueue<Payload extends PieceWatcherQueueTask = PieceWatcherQueueTask> extends BaseQueue<Payload> {
  onFailedAttempt(err: any, payload: Payload, _operation: Operation) {
    this.logger.error(`An error occurred: ${err.message}. [attempt#${err.attemptNumber}] id: ${payload.filePath} dir: ${payload.dir} ${payload.name}`)
    this.logger.error(err)
  }

  onIdle() {
    this.provider.save().then((_result) => {
      this.logger.log('saved')
    })
  }

  getOptions(): BaseOptions {
    return this.config.get<ConfigurationPiece>('piece').uploadQueue
  }
}
