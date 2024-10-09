import type {PieceModuleOptions} from "./piece.module.options.ts";
import fs from "node:fs/promises";
import {Inject, Injectable} from "@nestjs/common";
import chokidar from "chokidar";
import {PIECE_OPTIONS} from "./piece.constants";
import {Piece} from "./piece.ts";
import {Window} from '@doubleshot/nest-electron'
import type {BrowserWindow} from 'electron'
import {getHash} from "@main/piece/utils.ts";
import {PieceRoleEnum} from "@main/piece/piece-role.enum.ts";
import {PieceTypeEnum} from "@main/piece/piece-type.enum.ts";



@Injectable()
export class PieceService {
  private readonly data: Piece[];
  private isReady: boolean;

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
      // TODO handle we can read and write
    } catch (accessErr) {
      if (accessErr.code === "ENOENT") {
        // no file
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
      throw new TypeError("Invalid metadata data format");
    }
  }

  async _write() {
    try {
      const data = JSON.stringify(this.data, null, 2);
      await fs.writeFile(this.options.metadataPath, data, {encoding: "utf8", flush: true});
    } catch (writeErr) {
      console.error(writeErr);
      throw new Error(`File ${this.options.metadataPath} cannot write file`);
    }
    return null;
  }

  async write () {
    return this._write();
  }

  hasPiece(file: string) {
    return !!this.getPiece(file);
  }

  getAll() {
    return this.data;
  }

  getPiece(filePath: string) {
    return this.data.find((x) => x.filePath === filePath);
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

  watch() {
    const watcher = chokidar.watch(this.options.defaultWatchPath, {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true,
      // ignoreInitial: true,
      // cwd: this.options.defaultWatchPath,
    });

    watcher
      .on("add", this.onAdd.bind(this))
      .on("change", this.onChange.bind(this))
      .on("unlink", this.onUnlink.bind(this))
      .on("ready", this.onReady.bind(this))

    // watcher
    // .on("addDir", (path) => log(`Directory ${path} has been added`))
    // .on("unlinkDir", (path) => log(`Directory ${path} has been removed`))
    // .on("error", (error) => log(`Watcher error: ${error}`))
    // .on('raw', (event, path, details) => { log('Raw event info:', event, path, details) })
  }

  async onAdd(filePath: string, stat) {
    const piece = this.getPiece(filePath);

    if (!piece) {
      // unknown file, just add it
      const newPiece = await this.createFromFile(filePath);
      this.add(newPiece);
      if (this.isReady) {
        this.emitEvent("piece:created", piece)
      }
    } else {
      // known file, mark in as known
      piece.isDirty = false;
    }

    if (this.isReady) {
      // write only if ready, do not spam on startup, see onReady() method
      await this.write(); // throttle?
    }
  }

  async onChange(filePath: string, stat) {
    const piece = this.getPiece(filePath);
    if (!piece) {
      // almost impossible
      // unknown piece, just add it
      const newPiece = await this.createFromFile(filePath);
      this.add(newPiece);
    } else {
      piece.isDirty = false;
      piece.fileHash = await getHash(filePath);
      piece.touch();
    }

    await this.write(); // throttle?

    this.emitEvent("piece:updated", piece);
  }

  async onUnlink(path: string) {
    const piece = this.getPiece(path);

    if (!piece) return

    piece.deletedAt = Math.floor(Date.now() / 1000);

    this.emitEvent("piece:deleted", piece);
  }

  async onReady() {
    console.log("Initial scan complete. Watching for changes...");
    this.isReady = true;
    await this.write();
  }

  emitEvent(name: string, data: any) {
    this.mainWin.webContents.send("ipc-message", {name, data})
  }
}
