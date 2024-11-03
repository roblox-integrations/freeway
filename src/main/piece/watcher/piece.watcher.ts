import type {PieceModuleOptions} from '../piece.module.options.ts'
import {PieceEventEnum} from '@main/piece/enum/piece-event.enum'
import {Inject, Injectable, Logger} from '@nestjs/common'
import Queue from 'better-queue'
import {ensureDir} from 'fs-extra'

import {PIECE_OPTIONS} from '../piece.constants'
import {PieceService} from '../piece.service'
// import useQueue from './piece-queue.ts'

interface QueueFileTask {
  id: string
  filePath: string
  method: Function
}

@Injectable()
export abstract class PieceWatcher {
  protected isReady: boolean
  protected queue: Queue
  protected readonly logger = new Logger(PieceWatcher.name)

  constructor(@Inject(PIECE_OPTIONS) protected options: PieceModuleOptions, protected readonly service: PieceService) {
    this.queue = new Queue(async (input: QueueFileTask, cb: Function) => {
      // console.log(`-------------------> task start ${input.filePath}`);

      input.method.call(this, input.filePath)
        .then((result: any) => {
          cb(null, result)
        })
        .catch((err) => {
          console.error(err)
          cb(err)
        })
        .then(() => {
          // console.log(`-------------------> task end ${input.filePath}`);
        })
    })

    this.queue.on('drain', () => {
      // console.log('-------------------> drain');
      this.service.flush()
    })
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('### Starting piece watcher')
    await ensureDir(this.options.defaultWatchPath)
    await this.service.load()
    this.watch() // async manner
  }

  abstract watch()

  async onInit(filePath: string) {
    const piece = this.service.getPiece(filePath)
    if (!piece) {
      await this.service.addFromFile(filePath)
    }
    else {
      await this.service.updateFromFile(piece)
    }
  }

  async onChange(filePath: string) {
    const piece = this.service.getPiece(filePath)
    if (!piece) {
      await this.service.addFromFile(filePath)
      this.emitEvent(PieceEventEnum.created, piece)
    }
    else {
      await this.service.updateFromFile(piece)
      this.emitEvent(PieceEventEnum.updated, piece)
    }

    if (piece.isAutoSave) {
      // todo: queue this action
      await this.service.uploadAsset(piece)
    }

    await this.service.flush() // throttle?
  }

  async onUnlink(path: string) {
    const piece = this.service.getPiece(path)

    if (!piece)
      return

    this.service.removePiece(piece)

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
