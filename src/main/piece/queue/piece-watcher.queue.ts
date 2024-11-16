import {ConfigurationPiece} from '@main/_config/configuration'
import {PieceProvider} from '@main/piece/piece.provider'
import {Injectable, Logger} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import BetterQueue from 'better-queue'

export interface PieceWatcherQueueTask {
  id: string
  filePath: string // deprecated
  dir: string
  name: string
  fn: (task: PieceWatcherQueueTask) => Promise<any>
}

@Injectable()
export class PieceWatcherQueue {
  protected queue: BetterQueue
  protected readonly logger = new Logger(PieceWatcherQueue.name)
  protected readonly options: ConfigurationPiece

  constructor(
    private readonly config: ConfigService,
    protected readonly provider: PieceProvider,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')

    this.queue = new BetterQueue(async (input: PieceWatcherQueueTask, cb: (err: any, result?: any) => void) => {
      input.fn(input)
        .then((result: any) => {
          cb(null, result)
        })
        .catch((err: any) => {
          this.logger.error(`An error occurred: ${err.message}. id: ${input.filePath} dir: ${input.dir} ${input.name}`)
          this.logger.error(err)
          cb(err)
        })
    }, {concurrent: 20})

    this.queue.on('drain', () => {
      this.provider.save()
    })
  }

  push(task: PieceWatcherQueueTask): BetterQueue.Ticket {
    return this.queue.push(task)
  }
}
