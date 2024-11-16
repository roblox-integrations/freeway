import fs from 'node:fs/promises'
import {join} from 'node:path'
import {PieceWatcherQueue} from '@main/piece/queue'
import {Injectable, OnModuleDestroy} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import watcher, {AsyncSubscription} from '@parcel/watcher'
import micromatch from 'micromatch'
import {PieceExtTypeMap} from '../enum'
import {PieceProvider} from '../piece.provider'
import {PieceService} from '../piece.service'
import {PieceWatcher} from './piece.watcher'

@Injectable()
export class PieceParcelWatcher extends PieceWatcher implements OnModuleDestroy {
  private subscription: AsyncSubscription = null
  private readonly ignoreGlobs: string[] = []

  constructor(
    config: ConfigService,
    service: PieceService,
    provider: PieceProvider,
    queue: PieceWatcherQueue,
  ) {
    super(config, service, provider, queue)

    let globPattern = Array.from(PieceExtTypeMap.keys()).map(k => k.slice(1)).join('|')
    globPattern = `**/*.!(${globPattern})`

    this.ignoreGlobs = [
      '**/!(*.*)', // ignore files and dirs without ext (file-name.ext)
      '_*', // ignore _files and _dirs
      '.*', // ignore .files and .dirs
      globPattern,
    ]
  }

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

  async onModuleDestroy() {
    if (!this.subscription) {
      return
    }

    await this.subscription.unsubscribe()
  }
}
