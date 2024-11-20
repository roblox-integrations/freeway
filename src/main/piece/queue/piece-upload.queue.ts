import {ConfigurationPiece} from '@main/_config/configuration'
import {PieceProvider} from '@main/piece/piece.provider'
import {Injectable, Logger} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import BetterQueue from 'better-queue'

export interface PieceUploadQueueTask {
  id: string
  run: (task: PieceUploadQueueTask) => Promise<any>
}

@Injectable()
export class PieceUploadQueue {
  protected queue: BetterQueue
  protected readonly logger = new Logger(PieceUploadQueue.name)
  protected readonly options: ConfigurationPiece

  constructor(
    private readonly config: ConfigService,
    protected readonly provider: PieceProvider,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')

    this.queue = new BetterQueue(async (input: PieceUploadQueueTask, cb: (err: any, result?: any) => void) => {
      input.run(input)
        .then((result: any) => {
          cb(null, result)
        })
        .catch((err: any) => {
          this.logger.error(err)
          cb(err)
        })
    }, {concurrent: this.options.uploadQueue.concurrency, maxRetries: this.options.uploadQueue.retries})
  }

  push(task: PieceUploadQueueTask): BetterQueue.Ticket {
    return this.queue.push(task)
  }
}
