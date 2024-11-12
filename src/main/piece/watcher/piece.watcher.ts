import {ConfigurationPiece} from '@main/_config/configuration'
import {PieceEventEnum} from '@main/piece/enum/piece-event.enum'
import {PieceProvider} from '@main/piece/piece.provider'
import {Injectable, Logger} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import Queue from 'better-queue'
import {ensureDir} from 'fs-extra'
import {PieceService} from '../piece.service'

interface QueueFileTask {
  id: string
  filePath: string
  method: () => void
}

@Injectable()
export abstract class PieceWatcher {
  protected isReady: boolean
  protected queue: Queue
  protected readonly logger = new Logger(PieceWatcher.name)
  protected readonly options: ConfigurationPiece

  constructor(
    private readonly config: ConfigService,
    protected readonly service: PieceService,
    protected readonly provider: PieceProvider,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')

    this.queue = new Queue(async (input: QueueFileTask, cb: (err: any, result?: any) => void) => {
      input.method.call(this, input.filePath)
        .then((result: any) => {
          cb(null, result)
        })
        .catch((err: any) => {
          console.error(err)
          cb(err)
        })
    })

    this.queue.on('drain', () => {
      this.provider.save()
    })
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('### Starting piece watcher')
    await ensureDir(this.options.watchDirectory)
    await this.provider.load()
    this.watch() // async manner
  }

  abstract watch()

  async onInit(filePath: string) {
    const piece = this.provider.findOne({filePath})
    if (!piece) {
      await this.provider.createFromFile(filePath)
    }
    else {
      await this.provider.updateFromFile(piece)
    }
  }

  async onChange(filePath: string) {
    let piece = this.provider.findOne({filePath})
    if (!piece) {
      piece = await this.provider.createFromFile(filePath)
      this.emitEvent(PieceEventEnum.created, piece)
    }
    else {
      await this.provider.updateFromFile(piece)
      this.emitEvent(PieceEventEnum.updated, piece)
    }

    if (piece.isAutoSave) {
      // todo: queue this action?
      await this.service.uploadAsset(piece)
    }

    await this.provider.save() // throttle?
  }

  async onUnlink(filePath: string) {
    const piece = this.provider.findOne({filePath})

    if (!piece)
      return

    this.provider.remove(piece)

    this.emitEvent(PieceEventEnum.deleted, piece)
  }

  emitEvent(name: string, data: any) {
    this.service.emitEvent(name, data)
  }

  onReady() {
    this.logger.log('Ready. Initial scan complete. Watching for changes...')
    this.isReady = true
  }
}
