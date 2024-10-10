import type {PieceModuleOptions} from "./piece.module.options.ts";
import fs from "node:fs/promises";
import {Inject, Injectable, Logger} from "@nestjs/common";
import chokidar from "chokidar";
import {PIECE_OPTIONS} from "./piece.constants";
import {Piece, PieceEditable} from "./piece.ts";
import {Window} from '@doubleshot/nest-electron'
import type {BrowserWindow} from 'electron'
import {getHash, imageToRbxImageJimp, imageToRbxImagePngjs, now} from "@main/piece/utils.ts";
import {PieceRoleEnum} from "@main/piece/enum/piece-role.enum.ts";
import {PieceTypeEnum} from "@main/piece/enum/piece-type.enum.ts";


@Injectable()
export class PieceService {
  private readonly data: Piece[];
  private isReady: boolean;
  private readonly logger = new Logger(PieceService.name);

  constructor(@Inject(PIECE_OPTIONS) private options: PieceModuleOptions, @Window() private readonly mainWin: BrowserWindow) {
    this.data = [];
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

  async write() {
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

  public async getPieceByIdEditableJimp(id: string, round: number) {
    const piece = this.getPieceById(id) as PieceEditable
    piece.data = await imageToRbxImageJimp(piece.filePath, round)
    return piece
  }

  public async getPieceByIdEditablePngjs(id: string) {
    const piece = this.getPieceById(id) as PieceEditable
    piece.data = await imageToRbxImagePngjs(piece.filePath)
    return piece
  }

  add(piece: Piece): void {
    this.data.push(piece);
  }

  async generateFor(filePath: string) {
    const piece = this.getPiece(filePath);
    if (piece) {

      return;
    }

    const newPiece = await this.createFromFile(filePath);
    this.add(newPiece);

    return piece;
  }

  async createFromFile(filePath: string, role = PieceRoleEnum.asset, type = PieceTypeEnum.image) {
    const id = `ts-${Date.now()}` // TODO better uuid
    const hash = await getHash(filePath)
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

  async createPiece (filePath: string) {
    const newPiece = await this.createFromFile(filePath);
    this.add(newPiece);

    return newPiece;
  }

  async updatePiece (piece: Piece) {
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
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true,
      // ignoreInitial: true,
      // cwd: this.options.defaultWatchPath,
    });

    watcher
      .on("add", async (path) => {
        if (!this.isReady) {
          await this.onWatcherInit(path);
        }
        else {
          await this.onWatcherAdd(path);
        }
      })
      .on("change", this.onWatcherChange.bind(this))
      .on("unlink", this.onUnlink.bind(this))
      .on("ready", this.onWatcherReady.bind(this))

    // watcher
    // .on("addDir", (path) => log(`Directory ${path} has been added`))
    // .on("unlinkDir", (path) => log(`Directory ${path} has been removed`))
    // .on("error", (error) => log(`Watcher error: ${error}`))
    // .on('raw', (event, path, details) => { log('Raw event info:', event, path, details) })
  }

  async onWatcherInit(filePath: string/*, stat*/) {
    const piece = this.getPiece(filePath);
    if (!piece) {
      await this.createPiece(filePath);
    } else {
      await this.updatePiece(piece);
    }
  }

  async onWatcherAdd(filePath: string/*, stat*/) {
    const piece = this.getPiece(filePath);
    if (!piece) {
      await this.createPiece(filePath);
      this.emitEvent("piece:created", piece);
    } else {
      await this.updatePiece(piece);
      this.emitEvent("piece:updated", piece);
    }
    await this.write(); // throttle?
  }

  async onWatcherChange(filePath: string/*, stat*/) {
    const piece = this.getPiece(filePath);
    if (!piece) {
      // almost impossible
      // unknown piece, just add it
      const newPiece = await this.createFromFile(filePath);
      this.add(newPiece);
    } else {
      await this.updatePiece(piece);
    }

    this.emitEvent("piece:updated", piece);

    await this.write(); // throttle?
  }

  async onUnlink(path: string) {
    const piece = this.getPiece(path);

    if (!piece) return

    piece.deletedAt = now();

    this.emitEvent("piece:deleted", piece);
  }

  async onWatcherReady() {
    this.logger.log("Initial scan complete. Watching for changes...");
    this.isReady = true;
    await this.write();
  }

  emitEvent(name: string, data: any) {
    this.mainWin.webContents.send("ipc-message", {name, data})
  }
}
