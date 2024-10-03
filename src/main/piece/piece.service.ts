import type { PieceModuleOptions } from "./piece.module.options.ts";
import fs from "node:fs/promises";
import path from "node:path";
import { Inject, Injectable } from "@nestjs/common";
import chokidar from "chokidar";
import { glob, IOptions } from "glob";
import { PIECE_OPTIONS } from "./piece.constants";
import { Piece } from "./piece.ts";

@Injectable()
export class PieceService {
  private readonly watchPath: string;
  private readonly path: any;
  private readonly data: Piece[];

  constructor(@Inject(PIECE_OPTIONS) options: PieceModuleOptions) {
    this.path = options.metadataPath;
    this.data = [];
    this.watchPath = options.filesPath;

    console.log(
      options.metadataPath,
      options.filesPath
    );

    this.init();
  }

  async init() {
    await this.read();
    await this.generate();
    await this.write();

    this.watch();
  }

  async read() {
    try {
      await fs.access(this.path); // TODO stat?
      // TODO handle we can read and write
    }
    catch (accessErr) {
      if (accessErr.code === "ENOENT") {
        // no file
        await fs.writeFile(this.path, "[]"); // create empty-array file
      }
      else {
        throw accessErr;
      }
    }

    let data = null;
    try {
      data = await fs.readFile(this.path, { encoding: "utf8" });
    }
    catch (readErr) {
      console.error(readErr);
      throw new Error(`File ${this.path} does not exist`);
    }

    try {
      data = JSON.parse(data);
    }
    catch (parseErr) {
      console.error(parseErr);
      throw new Error(`Cannot parse JSON file ${this.path}`);
    }

    if (Array.isArray(data)) {
      for (const x of data) {
        this.data.push(Piece.fromObject(x));
      }
    }
    else {
      throw new TypeError("Invalid metadata data format");
    }
  }

  async write() {
    try {
      await fs.writeFile(this.path, JSON.stringify(this.data, null, 2), { encoding: "utf8", flush: true });
    }
    catch (writeErr) {
      console.error(writeErr);
      throw new Error(`File ${this.path} cannot write file`);
    }
    return null;
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

  async generate() {
    const pattern = `${this.watchPath}/**/*.png`;

    const files = await (glob(pattern, { ignore: "node_modules/**", posix: false } as IOptions, null) as unknown as Promise<string[]>);

    for (const file of files) {
      await this.generateFor(file);
    }
  }

  async generateFor(filePath: string) {
    const piece = this.getPiece(filePath);
    if (piece) {
      // update piece
      return;
    }

    const newPiece = await Piece.fromFile(filePath);
    this.add(newPiece);

    return piece;
  }

  watch() {
    const watcher = chokidar.watch(this.watchPath, {
      ignored: /(^|[/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true
    });

    // Something to use when events are received.
    const log = console.log.bind(console);

    // Add event listeners.
    watcher
      .on("add", async (path) => {
        log(`File ${path} has been added`);
        await this.generateFor(path);
        await this.write();
      })
      .on("change", (path, stat) => {
        log(`File ${path} has been changed`);
        log(JSON.stringify(stat));
      })
      .on("unlink", (path) => log(`File ${path} has been removed`));

    watcher
      .on("addDir", (path) => log(`Directory ${path} has been added`))
      .on("unlinkDir", (path) => log(`Directory ${path} has been removed`))
      .on("error", (error) => log(`Watcher error: ${error}`))
      .on("ready", () => log("Initial scan complete. Ready for changes"));
    // .on('raw', (event, path, details) => { // internal
    // log('Raw event info:', event, path, details);
    // });
  }
}
