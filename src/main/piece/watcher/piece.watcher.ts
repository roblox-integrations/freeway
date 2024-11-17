import fs from 'node:fs/promises'
import {join} from 'node:path'
import {ConfigurationPiece} from '@main/_config/configuration'
import {PieceExtTypeMap} from '@main/piece/enum'
import {PieceEventEnum} from '@main/piece/enum/piece-event.enum'
import {PieceProvider} from '@main/piece/piece.provider'
import {PieceWatcherQueue, PieceWatcherQueueTask} from '@main/piece/queue'
import {Injectable, Logger} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import watcher, {AsyncSubscription} from '@parcel/watcher'
import {ensureDir} from 'fs-extra'
import micromatch from 'micromatch'
import {PieceService} from '../piece.service'

@Injectable()
export class PieceWatcher {
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

    let globPattern = Array.from(PieceExtTypeMap.keys()).map(k => k.slice(1)).join('|')
    globPattern = `**/*.!(${globPattern})`

    this.ignoreGlobs = [
      '**/!(*.*)', // ignore files and dirs without ext (file-name.ext)
      '_*', // ignore _files and _dirs
      '.*', // ignore .files and .dirs
      globPattern,
    ]
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('### Starting piece watcher')
    await ensureDir(this.options.watchDirectory)
    await this.provider.load()
    this.watch().then((_) => {}) // async manner
  }

  async onModuleDestroy() {
    if (!this.subscription) {
      return
    }

    await this.subscription.unsubscribe()
  }

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

  private subscription: AsyncSubscription = null
  private readonly ignoreGlobs: string[] = []

  async initialScan() {
    let files = await fs.readdir(this.options.watchDirectory, {recursive: true})
    files = files.filter(x => !micromatch.isMatch(x, this.ignoreGlobs))

    files.forEach((name) => {
      const dir = this.options.watchDirectory
      const filePath = join(this.options.watchDirectory, name) // make absolute path
      this.queue.push({
        id: filePath,
        filePath,
        dir,
        name,
        fn: (task) => {
          return this.onInit(task)
        },
      })
    })
  }

  async watch() {
    await this.initialScan()

    this.onReady()

    this.logger.log(`Start watching dir ${this.options.watchDirectory}`)
    this.subscription = await watcher.subscribe(this.options.watchDirectory, (err, events) => {
      if (err) {
        this.logger.log(err.stack)
      }
      events.forEach((event: {type: 'create' | 'update' | 'delete', path: string}) => {
        if (!event.path?.startsWith(this.options.watchDirectory)) {
          this.logger.debug(`Ignore event ${event.type} occurred for file ${event.path}`)
          return
        }

        const dir = this.options.watchDirectory
        const name = event.path.slice(dir.length + 1)

        if (event.type === 'create' || event.type === 'update') {
          this.logger.debug(`Event "${event.type}": ${event.path}`)
          this.queue.push({
            id: event.path,
            filePath: event.path,
            dir,
            name,
            fn: (task) => {
              return this.onChange(task)
            },
          })
        }
        if (event.type === 'delete') {
          this.logger.debug(`Event "${event.type}": ${event.path}`)
          this.queue.push({
            id: event.path,
            filePath: event.path,
            dir,
            name,
            fn: (task) => {
              return this.onUnlink(task)
            },
          })
        }
      })
    }, {ignore: this.ignoreGlobs})
  }
}
