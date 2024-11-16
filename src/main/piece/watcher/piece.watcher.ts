import {ConfigurationPiece} from '@main/_config/configuration'
import {PieceEventEnum} from '@main/piece/enum/piece-event.enum'
import {PieceProvider} from '@main/piece/piece.provider'
import {PieceWatcherQueue, PieceWatcherQueueTask} from '@main/piece/queue'
import {Injectable, Logger} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {ensureDir} from 'fs-extra'
import {PieceService} from '../piece.service'

@Injectable()
export abstract class PieceWatcher {
  protected isReady: boolean
  protected readonly logger = new Logger(PieceWatcher.name)
  protected readonly options: ConfigurationPiece

  constructor(
    private readonly config: ConfigService,
    protected readonly service: PieceService,
    protected readonly provider: PieceProvider,
    protected readonly queue: PieceWatcherQueue,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('### Starting piece watcher')
    await ensureDir(this.options.watchDirectory)
    await this.provider.load()
    this.watch() // async manner
  }

  abstract watch()

  async onInit(queueTask: PieceWatcherQueueTask) {
    const {dir, name} = queueTask

    // TODO ES, replace with this one
    // const piece = this.provider.findOne({dir, name})
    const piece = this.provider.findOne(x => (x.dir === dir && x.name === name) || x.filePath === `${dir}/${name}` || x.filePath === `${dir}\\${name}`)
    if (!piece) {
      await this.provider.createFromFile(dir, name)
    }
    else {
      piece.dir = dir
      piece.name = name
      await this.provider.updateFromFile(piece)
    }
  }

  async onChange(queueTask: PieceWatcherQueueTask) {
    const {dir, name} = queueTask
    let piece = this.provider.findOne({dir, name})
    if (!piece) {
      piece = await this.provider.createFromFile(dir, name)
      this.emitEvent(PieceEventEnum.created, piece)
    }
    else {
      await this.provider.updateFromFile(piece)
      this.emitEvent(PieceEventEnum.updated, piece)
    }

    if (piece.isAutoSave) {
      await this.service.queueUploadAsset(piece)
    }

    await this.provider.save() // throttle?
  }

  async onUnlink(queueTask: PieceWatcherQueueTask) {
    const {dir, name} = queueTask
    const piece = this.provider.findOne({dir, name})

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
