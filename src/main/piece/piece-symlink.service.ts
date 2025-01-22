import {join, parse} from 'node:path'
import {PieceEventEnum} from '@main/piece/enum'
import {PieceProvider} from '@main/piece/piece.provider'

import {Injectable} from '@nestjs/common'
import {OnEvent} from '@nestjs/event-emitter'
import {studioContentPath} from '@roblox-integrations/roblox-install'
import fse from 'fs-extra'
import {glob} from 'glob'
import pMap from 'p-map'
import {Piece} from './piece'

@Injectable()
export class PieceSymlinkService {
  constructor(
    private readonly provider: PieceProvider,
  ) {
    //
  }

  async ensureSymlink(piece: Piece) {
    const dest = this.getSymlinkDest(piece)
    const fullPath = join(piece.dir, piece.name)
    // await fse.ensureSymlink(fullPath, dest)
    await fse.ensureLink(fullPath, dest)
  }

  async removeSymlink(piece: Piece) {
    const dest = this.getSymlinkDest(piece)
    await fse.remove(dest)
  }

  async syncSymlinks() {
    const fsSymlinks = await glob('piece-*-*.*', {cwd: studioContentPath()})

    const pieces = this.provider.findMany({deletedAt: null})

    const actualSymlinks = pieces.map((p) => {
      return this.getSymlinkName(p)
    })

    const toRemoveSymlinks = fsSymlinks.filter(x => !actualSymlinks.includes(x))
    const toCreateSymlinks = actualSymlinks.filter(x => !fsSymlinks.includes(x))

    await pMap(toRemoveSymlinks, async (symlinkName: string) => {
      await fse.remove(join(studioContentPath(), symlinkName))
    }, {concurrency: 5})

    const piecesToCreateSymlink = pieces.filter((p: Piece) => {
      return toCreateSymlinks.includes(this.getSymlinkName(p))
    })

    await pMap(piecesToCreateSymlink, async (piece: Piece) => {
      return this.ensureSymlink(piece)
    }, {concurrency: 5})
  }

  private getSymlinkName(piece: Piece): string {
    const parsed = parse(piece.name)
    return `piece-${piece.id}-${piece.hash}${parsed.ext}`
  }

  private getSymlinkDest(piece: Piece): string {
    const dir = studioContentPath()
    const name = this.getSymlinkName(piece)
    return join(dir, 'freeway', name)
  }

  @OnEvent(PieceEventEnum.initiated)
  async handlePieceInitiated(piece: Piece) {
    await this.ensureSymlink(piece)
  }

  @OnEvent(PieceEventEnum.created)
  async handlePieceCreated(piece: Piece) {
    await this.ensureSymlink(piece)
  }

  @OnEvent(PieceEventEnum.changed)
  async handlePieceChanged(piece: Piece) {
    await this.ensureSymlink(piece)
  }

  @OnEvent(PieceEventEnum.deleted)
  async handlePieceDeleted(piece: Piece) {
    await this.removeSymlink(piece)
  }
}
