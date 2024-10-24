import type {PieceModuleOptions} from "./piece.module.options.ts";
import {parse} from "node:path";
import {Inject, Injectable, Logger} from "@nestjs/common";
import chokidar from "chokidar";
import {PIECE_OPTIONS} from "./piece.constants";
import {PieceService} from "./piece.service";
import {PieceEventEnum} from "@main/piece/enum/piece-event.enum.ts";
import {PieceExtTypeMap} from "@main/piece/enum/piece-ext-type.map.ts";

import Queue from 'better-queue'
import {ensureDir} from "fs-extra";
// import useQueue from './piece-queue.ts'


interface QueueFileTask {
  id: string
  filePath: string
  method: Function
}

@Injectable()
export class PieceWatcher {
  private isReady: boolean;
  private queue: Queue;
  private readonly logger = new Logger(PieceWatcher.name);

  constructor(@Inject(PIECE_OPTIONS) private options: PieceModuleOptions, private readonly service: PieceService) {
    this.queue = new Queue(async (input: QueueFileTask, cb: Function) => {
      // console.log(`-------------------> task start ${input.filePath}`);

      input.method.call(this, input.filePath)
        .then((result: any) => {
          cb(null, result);
        })
        .catch((err) => {
          console.error(err);
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


    // this.queue = useQueue({concurrency: 1});
    // this.queue.on('idle', async () => {
    //   await this.flush()
    // })

  }

  async onModuleInit(): Promise<void> {
    this.logger.log("### Starting piece watcher")
    await ensureDir(this.options.defaultWatchPath)
    await this.service.load();
    this.watch(); // async manner
  }


  async watch() {
    const watcher = chokidar.watch(this.options.defaultWatchPath, {
      ignored: (filePath, stats) => {
        if (stats?.isDirectory()) {
          return false;
        }

        if (stats?.isFile()) {
          const parsed = parse(filePath);
          if (parsed.name[0] == '.' || parsed.name[0] === '_') {
            // ignore .dot-files and _underscore-files
            return true;
          }

          return !PieceExtTypeMap.has(parsed.ext);
        }
      },
      ignoreInitial: false,
      persistent: true,
      usePolling: true,
      awaitWriteFinish: true,
      depth: 99,
      alwaysStat: true,
    });

    watcher
      .on("add", (filePath) => {
        this.logger.log('add', filePath);
        if (!this.isReady) {
          // this.queue.add(async () => {
          //   await this.onWatcherInit(filePath);
          // });
          this.queue.push({id: filePath, filePath, method: this.onInit})
        } else {
          // this.queue.add(async () => {
          //   await this.onWatcherChange(filePath);
          // });
          this.queue.push({id: filePath, filePath, method: this.onChange})
        }
      })
      .on("change", filePath => {
        this.logger.log('change', filePath);
        // this.queue.add(async () => {
        //   await this.onWatcherInit(filePath);
        // });
        this.queue.push({id: filePath, filePath, method: this.onChange})
      })
      .on("unlink", filePath => {
        this.logger.log('unlink')
        // this.queue.add(async () => {
        //   await this.onWatcherUnlink(filePath);
        // });
        this.queue.push({id: filePath, filePath, method: this.onUnlink})
      })
      .on("ready", () => {
        this.onReady()
      })
      .on('raw', (event, path, details) => {
        this.logger.log('Raw event info:', event, path, details)
      })

    // watcher
    // .on("addDir", (path) => log(`Directory ${path} has been added`))
    // .on("unlinkDir", (path) => log(`Directory ${path} has been removed`))
    // .on("error", (error) => log(`Watcher error: ${error}`))

  }

  async onInit(filePath: string) {
    const piece = this.service.getPiece(filePath);
    if (!piece) {
      await this.service.addFromFile(filePath);
    } else {
      await this.service.updateFromFile(piece);
    }
  }

  async onChange(filePath: string) {
    const piece = this.service.getPiece(filePath);
    if (!piece) {
      await this.service.addFromFile(filePath);
      this.emitEvent(PieceEventEnum.created, piece);
    } else {
      await this.service.updateFromFile(piece);
      this.emitEvent(PieceEventEnum.updated, piece);
    }

    if (piece.isAutoSave) {
      // TODO: queue this action
      await this.service.uploadAsset(piece);
    }

    await this.service.flush(); // throttle?
  }

  async onUnlink(path: string) {
    const piece = this.service.getPiece(path);

    if (!piece) return

    this.service.removePiece(piece);

    this.emitEvent(PieceEventEnum.deleted, piece);
  }

  emitEvent (name: string, data: any) {
    this.service.emitEvent(name, data)
  }

  onReady() {
    this.logger.log("Ready. Initial scan complete. Watching for changes...");
    this.isReady = true;
  }
}
