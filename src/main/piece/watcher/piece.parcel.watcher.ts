import fs from 'node:fs/promises'
import {join} from 'node:path'
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
  ) {
    super(config, service, provider)

    let globPattern = Array.from(PieceExtTypeMap.keys()).map(k => k.slice(1)).join('|')
    globPattern = `**/*.!(${globPattern})`

    this.ignoreGlobs = [
      '_*',
      '.*',
      globPattern,
    ]
  }

  async initialScan() {
    let files = await fs.readdir(this.options.watchDirectory, {recursive: true})
    files = files.filter(x => !micromatch.isMatch(x, this.ignoreGlobs))

    files.forEach((file) => {
      const filePath = join(this.options.watchDirectory, file) // make absolute path
      this.queue.push({id: filePath, filePath, method: this.onInit})
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

        if (event.type === 'create' || event.type === 'update') {
          this.logger.debug(`Event "${event.type}": ${event.path}`)
          this.queue.push({id: event.path, filePath: event.path, method: this.onChange})
        }
        if (event.type === 'delete') {
          this.logger.debug(`Event "${event.type}": ${event.path}`)
          this.queue.push({id: event.path, filePath: event.path, method: this.onUnlink})
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
