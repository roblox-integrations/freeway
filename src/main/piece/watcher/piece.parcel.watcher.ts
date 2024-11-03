import type {PieceModuleOptions} from '../piece.module.options.ts'
import fs from 'node:fs/promises'
import {join} from 'node:path'
import {Inject, Injectable, OnModuleDestroy} from '@nestjs/common'
import watcher, {AsyncSubscription} from '@parcel/watcher'
import micromatch from 'micromatch'
import {PieceExtTypeMap} from '../enum'
import {PIECE_OPTIONS} from '../piece.constants'
import {PieceService} from '../piece.service'
import {PieceWatcher} from './piece.watcher'

@Injectable()
export class PieceParcelWatcher extends PieceWatcher implements OnModuleDestroy {
  private subscription: AsyncSubscription = null
  private snapshotPath: string = ''
  private ignoreGlobs: string[] = []

  constructor(@Inject(PIECE_OPTIONS) protected options: PieceModuleOptions, protected readonly service: PieceService) {
    super(options, service)
    this.snapshotPath = join(this.options.defaultWatchPath, 'snapshot.txt')

    let globPattern = Array.from(PieceExtTypeMap.keys()).map(k => k.slice(1)).join('|')
    globPattern = `**/*.!(${globPattern})`

    this.ignoreGlobs = [
      // this.snapshotPath,
      '_*',
      '.*',
      globPattern,
    ]
  }

  async initialScan() {
    let files = await fs.readdir(this.options.defaultWatchPath, {recursive: true})
    files = files.filter(x => !micromatch.isMatch(x, this.ignoreGlobs))

    files.forEach((file) => {
      const filePath = join(this.options.defaultWatchPath, file) // make absolute path
      this.queue.push({id: filePath, filePath, method: this.onInit})
    })
  }

  async watch() {
    await this.initialScan()

    this.onReady()

    this.logger.log(`Start watching dir ${this.options.defaultWatchPath}`)
    this.subscription = await watcher.subscribe(this.options.defaultWatchPath, (err, events) => {
      if (err) {
        this.logger.log(err.stack)
      }
      events.forEach((event: {type: 'create' | 'update' | 'delete', path: string}) => {
        if (!event.path?.startsWith(this.options.defaultWatchPath)) {
          //
          this.logger.log(`Ignore event ${event.type} occurred for file ${event.path}`)
          return
        }

        if (event.type === 'create' || event.type === 'update') {
          this.logger.log({id: event.path, filePath: event.path, method: 'this.onChange'})
          this.queue.push({id: event.path, filePath: event.path, method: this.onChange})
        }
        if (event.type === 'delete') {
          this.logger.log({id: event.path, filePath: event.path, method: 'this.onUnlink'})
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
    await watcher.writeSnapshot(this.options.workingDir, this.snapshotPath)
    this.logger.log('onModuleDestroy() ===================')
  }

  async getEventsSince() {
    // we don't need this, I think
    try {
      return await watcher.getEventsSince(this.options.defaultWatchPath, this.snapshotPath, {ignore: this.ignoreGlobs})
    }
    catch (err) {
      this.logger.error(err.stack)
    }
    return []
  }
}
