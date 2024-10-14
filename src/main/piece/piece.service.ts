import type {PieceModuleOptions} from "./piece.module.options.ts";
import fs from "node:fs/promises";
import {parse} from "node:path";
import {Inject, Injectable, Logger} from "@nestjs/common";
import chokidar from "chokidar";
import {PIECE_OPTIONS} from "./piece.constants";
import {Piece, PieceEditable} from "./piece.ts";
import {Window} from '@doubleshot/nest-electron'
import type {BrowserWindow} from 'electron'
import {getHash, dumpToRbxImage, now, dumpToRbxMesh} from "@main/piece/utils.ts";
import {PieceRoleEnum} from "@main/piece/enum/piece-role.enum.ts";
import {PieceTypeEnum} from "@main/piece/enum/piece-type.enum.ts";
import {PieceExtTypeMap} from "@main/piece/enum/piece-ext-type.map.ts";
import Queue from 'better-queue'

// import useQueue from './piece-queue.ts'


interface QueueFileTask {
  id: string
  filePath: string
  method: Function
}


@Injectable()
export class PieceService {
  private readonly data: Piece[];
  private isReady: boolean;
  private queue: Queue;
  private readonly logger = new Logger(PieceService.name);

  constructor(@Inject(PIECE_OPTIONS) private options: PieceModuleOptions, @Window() private readonly mainWin: BrowserWindow) {
    this.data = [];

    this.queue = new Queue(async (input: QueueFileTask, cb: Function) => {
      // console.log(`-------------------> task start ${input.filePath}`);

      input.method.call(this, input.filePath)
        .then((result) => {
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
      this.flush()
    })


    // this.queue = useQueue({concurrency: 1});
    // this.queue.on('idle', async () => {
    //   await this.flush()
    // })

  }

  async init() {
    await this.load();
    this.watch();
  }

  async load() {
    try {
      await fs.access(this.options.metadataPath);
    } catch (accessErr) {
      if (accessErr.code === "ENOENT") {
        await fs.writeFile(this.options.metadataPath, "[]"); // create empty-array file
      } else {
        throw accessErr;
      }
    }

    let data = null;
    try {
      data = await fs.readFile(this.options.metadataPath, {encoding: "utf8"});
      data = data || '[]';
    } catch (readErr) {
      console.error(readErr);
      throw new Error(`File ${this.options.metadataPath} does not exist`);
    }

    try {
      data = JSON.parse(data);
    } catch (parseErr) {
      console.error(parseErr);
      throw new Error(`Cannot parse JSON file ${this.options.metadataPath}`);
    }

    if (Array.isArray(data)) {
      for (const x of data) {
        this.data.push(this.createFromObject(x));
      }
    } else {
      throw new TypeError("Invalid metadata format");
    }
  }

  async _write(): Promise<any> {
    try {
      const data = JSON.stringify(this.data, null, 2);
      await fs.writeFile(this.options.metadataPath, data, {encoding: "utf8", flush: true});
    } catch (writeErr) {
      console.error(writeErr);
      throw new Error(`File ${this.options.metadataPath} cannot write file`);
    }
    return null;
  }

  async flush() {
    return this._write();
  }

  hasPiece(file: string): boolean {
    return !!this.getPiece(file);
  }

  getAll(): Piece[] {
    return this.data;
  }

  getPiece(filePath: string): Piece {
    return this.data.find((x) => x.filePath === filePath);
  }

  getPieceById(id: string): Piece {
    return this.data.find((x) => x.id === id);
  }

  public async getPieceByIdDumped(id: string, round: number) {
    const piece = this.getPieceById(id) as PieceEditable
    piece.data = await this.getDump(piece, round)
    return piece
  }

  public async getDump(piece: Piece, round: number) {
    if (piece.type === PieceTypeEnum.image) {
      return await dumpToRbxImage(piece.filePath, round)
    } else if (piece.type === PieceTypeEnum.mesh) {
      return await dumpToRbxMesh(piece.filePath)
    }
  }

  add(piece: Piece): void {
    this.data.push(piece);
  }

  async createFromFile(filePath: string, role = PieceRoleEnum.asset) {

    const id = this.generateUniqId()
    const hash = await getHash(filePath)

    const parsed = parse(filePath);
    const type = PieceExtTypeMap.get(parsed.ext) || PieceTypeEnum.unknown as PieceTypeEnum;

    const piece = new Piece(id, role, type, filePath, hash);
    piece.isDirty = false;

    return piece;
  }

  createFromObject(object: any): Piece {
    return new Piece(
      object.id,
      object.role,
      object.type,
      object.filePath,
      object.fileHash,
      object.assetIds,
      object.updatedAt
    )
  }

  async createPiece(filePath: string) {
    const newPiece = await this.createFromFile(filePath);
    this.add(newPiece);

    return newPiece;
  }

  async updatePiece(piece: Piece) {
    piece.isDirty = false;
    piece.deletedAt = null;

    const hash = await getHash(piece.filePath);
    if (hash !== piece.fileHash) {
      piece.fileHash = hash;
      piece.updatedAt = now();
    }

    return piece;
  }

  watch() {
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
          this.queue.push({id: filePath, filePath, method: this.onWatcherInit})
        } else {
          // this.queue.add(async () => {
          //   await this.onWatcherChange(filePath);
          // });
          this.queue.push({id: filePath, filePath, method: this.onWatcherChange})
        }
      })
      .on("change", filePath => {
        this.logger.log('change', filePath);
        // this.queue.add(async () => {
        //   await this.onWatcherInit(filePath);
        // });
        this.queue.push({id: filePath, filePath, method: this.onWatcherChange})
      })
      .on("unlink", filePath => {
        this.logger.log('unlink')
        // this.queue.add(async () => {
        //   await this.onUnlink(filePath);
        // });
        this.queue.push({id: filePath, filePath, method: this.onUnlink})
      })
      .on("ready", () => {
        this.onWatcherReady()
      })
      .on('raw', (event, path, details) => {
        this.logger.log('Raw event info:', event, path, details)
      })

    // watcher
    // .on("addDir", (path) => log(`Directory ${path} has been added`))
    // .on("unlinkDir", (path) => log(`Directory ${path} has been removed`))
    // .on("error", (error) => log(`Watcher error: ${error}`))

  }

  async onWatcherInit(filePath: string) {
    const piece = this.getPiece(filePath);
    if (!piece) {
      await this.createPiece(filePath);
    } else {
      await this.updatePiece(piece);
    }
  }

  async onWatcherChange(filePath: string) {
    const piece = this.getPiece(filePath);
    if (!piece) {
      await this.createPiece(filePath);
      this.emitEvent("piece:created", piece);
    } else {
      await this.updatePiece(piece);
      this.emitEvent("piece:updated", piece);
    }
    await this.flush(); // throttle?
  }

  async onUnlink(path: string) {
    const piece = this.getPiece(path);

    if (!piece) return

    piece.deletedAt = now();

    this.emitEvent("piece:deleted", piece);
  }

  onWatcherReady() {
    this.logger.log("Ready. Initial scan complete. Watching for changes...");
    this.isReady = true;
  }

  emitEvent(name: string, data: any) {
    this.mainWin.webContents.send("ipc-message", {name, data})
  }

  private generateUniqId() {
    for (let i = 0; ; i++) {
      const id = generateAlphabeticalId(Math.floor(i / 10 + 4));
      if (!this.getPieceById(id)) {
        return id;
      }
    }
  }
}

export function generateAlphabeticalId(length: number) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
