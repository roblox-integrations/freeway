import fs from 'node:fs/promises'
import {join} from 'node:path'
import {ConfigurationPiece} from '@main/_config/configuration'
import {PieceExtTypeMap} from '@main/piece/enum'
import {PieceEventEnum} from '@main/piece/enum/piece-event.enum'
import {PieceProvider} from '@main/piece/piece.provider'
import {PieceWatcherQueue, PieceWatcherQueueTask} from '@main/piece/queue'
import {Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {EventEmitter2} from '@nestjs/event-emitter'
import watcher, {AsyncSubscription} from '@parcel/watcher'
import {ensureDir} from 'fs-extra'
import micromatch from 'micromatch'

@Injectable()
export class PieceWatcher implements OnApplicationBootstrap, OnApplicationShutdown {
  protected isReady: boolean
  protected readonly logger = new Logger(PieceWatcher.name)
  protected readonly options: ConfigurationPiece
  private subscription: AsyncSubscription = null
  private readonly ignoreGlobs: string[] = []

  constructor(
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    protected readonly provider: PieceProvider,
    protected readonly queue: PieceWatcherQueue,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')

    let globPattern = Array.from(PieceExtTypeMap.keys()).map(k => `*${k}`).join('|')
    globPattern = `**/!(${globPattern})`

    this.ignoreGlobs = [
      '**/!(*.*)', // ignore files and dirs without ext (file-name.ext)
      '_*', // ignore _files and _dirs
      '.*', // ignore .files and .dirs
      globPattern,
    ]
  }

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('### Starting piece watcher')
    await ensureDir(this.options.watchDirectory)
    await this.provider.load()
    await this.startWatch()
    await this.initialScan()
    this.onReady()
  }

  async onApplicationShutdown(): Promise<void> {
    await this.stopWatch()
  }

  async initialScan() {
    let files = await fs.readdir(this.options.watchDirectory, {recursive: true})
    files = files.filter(x => !micromatch.isMatch(x, this.ignoreGlobs))

    const promises = files.map((name) => {
      const dir = this.options.watchDirectory
      const fullPath = join(this.options.watchDirectory, name) // make absolute path
      return this.queue.push(fullPath, {
        fullPath,
        dir,
        name,
        run: (task) => {
          return this.onInit(task)
        },
      })
    })

    return await Promise.allSettled(promises)
  }

  async stopWatch() {
    if (!this.subscription) {
      return
    }

    await this.subscription.unsubscribe()
    this.logger.log(`Stopped watching dir ${this.options.watchDirectory}`)
  }

  async startWatch() {
    this.logger.log(`Start watching dir ${this.options.watchDirectory}`)
    this.subscription = await watcher.subscribe(this.options.watchDirectory, (err, events) => {
      if (err) {
        this.logger.log(err.stack)
      }
      events.forEach((event: {type: 'create' | 'update' | 'delete', path: string}) => {
        if (!event.path?.startsWith(this.options.watchDirectory)) {
          // in some cases parcel watcher grabs file events not in watchDirectory
          this.logger.debug(`Ignore event ${event.type} occurred for file ${event.path}`)
          return
        }

        const dir = this.options.watchDirectory
        const name = event.path.slice(dir.length + 1)

        if (event.type === 'create' || event.type === 'update') {
          this.logger.debug(`Event "${event.type}": ${event.path}`)
          this.queue.push(event.path, {
            fullPath: event.path,
            dir,
            name,
            run: (task) => {
              return this.onChange(task)
            },
          })
        }
        if (event.type === 'delete') {
          this.logger.debug(`Event "${event.type}": ${event.path}`)
          this.queue.push(event.path, {
            fullPath: event.path,
            dir,
            name,
            run: (task) => {
              return this.onUnlink(task)
            },
          })
        }
      })
    }, {ignore: this.ignoreGlobs})
  }

  async onInit(queueTask: PieceWatcherQueueTask) {
    const {dir, name} = queueTask
    let piece = this.provider.findOne({dir, name})
    if (!piece) {
      piece = await this.provider.createFromFile(dir, name)
    }
    else {
      await this.provider.updateFromFile(piece)
    }

    this.eventEmitter.emit(PieceEventEnum.initiated, piece)
  }

  async onChange(queueTask: PieceWatcherQueueTask) {
    const {dir, name} = queueTask
    let piece = this.provider.findOne({dir, name})
    if (!piece) {
      piece = await this.provider.createFromFile(dir, name)
      this.eventEmitter.emit(PieceEventEnum.created, piece)
    }
    else {
      await this.provider.updateFromFile(piece)
      this.eventEmitter.emit(PieceEventEnum.changed, piece)
    }

    await this.provider.save() // queue?
  }

  async onUnlink(queueTask: PieceWatcherQueueTask) {
    const {dir, name} = queueTask
    const piece = this.provider.findOne({dir, name})

    if (!piece)
      return

    this.provider.delete(piece)

    this.eventEmitter.emit(PieceEventEnum.deleted, piece)
  }

  onReady() {
    this.logger.log('Initial scan completed...')
    this.isReady = true

    this.eventEmitter.emit(PieceEventEnum.watcherReady)
  }
}
