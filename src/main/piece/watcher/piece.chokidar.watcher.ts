import {parse} from "node:path";
import {Injectable} from "@nestjs/common";
import chokidar from "chokidar";
import {PieceExtTypeMap} from "../enum";
import {PieceWatcher} from "./piece.watcher";


@Injectable()
export class PieceChokidarWatcher extends PieceWatcher {
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
        this.logger.log(`add ${filePath}`);
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
        this.logger.log(`change ${filePath}` );
        // this.queue.add(async () => {
        //   await this.onWatcherInit(filePath);
        // });
        this.queue.push({id: filePath, filePath, method: this.onChange})
      })
      .on("unlink", filePath => {
        this.logger.log(`unlink ${filePath}`);
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
}
