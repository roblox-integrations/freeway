import {join, parse} from 'node:path'
import {platform} from '@electron-toolkit/utils'
import {PieceEventEnum} from '@main/piece/enum'

import {PieceProvider} from '@main/piece/piece.provider'
import {Injectable} from '@nestjs/common'
import {OnEvent} from '@nestjs/event-emitter'
import {studioContentPath} from '@roblox-integrations/roblox-install'
import fse from 'fs-extra'
import {glob} from 'glob'
import pMap from 'p-map'
import {Piece} from './piece'

const LINK_NAME_GLOB = '*.*'
const LINK_DIR = 'freeway'
const LINKS_DEST_DIR = join(studioContentPath(), LINK_DIR)

@Injectable()
export class PieceLinkService {
  constructor(
    private readonly provider: PieceProvider,
  ) {
    //
  }

  async ensureLinks(piece: Piece) {
    const dest = this.getLinkPath(piece)
    const fullPath = join(piece.dir, piece.name)

    if (platform.isWindows) {
      // use hard links for windows for now
      await fse.ensureLink(fullPath, dest)
    }
    else {
      await fse.ensureSymlink(fullPath, dest)
    }
  }

  async removeLinks(piece: Piece) {
    const dest = this.getLinkPath(piece)
    await fse.remove(dest)
  }

  async syncLinks() {
    const fsLinks = await glob(LINK_NAME_GLOB, {cwd: LINKS_DEST_DIR})

    const pieces = this.provider.findMany({deletedAt: null, isDirty: false})

    const actualLinks = pieces.map((p) => {
      return this.getLinkName(p)
    })

    const toRemoveLinks = fsLinks.filter(x => !actualLinks.includes(x))
    const toCreateLinks = actualLinks.filter(x => !fsLinks.includes(x))

    await pMap(toRemoveLinks, async (linksName: string) => {
      await fse.remove(join(LINKS_DEST_DIR, linksName))
    }, {concurrency: 5})

    const piecesToCreateLinks = pieces.filter((p: Piece) => {
      return toCreateLinks.includes(this.getLinkName(p))
    })

    await pMap(piecesToCreateLinks, async (piece: Piece) => {
      return this.ensureLinks(piece)
    }, {concurrency: 5})
  }

  private getLinkName(piece: Piece): string {
    const parsed = parse(piece.name)
    return `${piece.id}-${piece.hash}${parsed.ext}`
  }

  private getLinkPath(piece: Piece): string {
    const name = this.getLinkName(piece)
    return join(LINKS_DEST_DIR, name)
  }

  @OnEvent(PieceEventEnum.initiated)
  async handlePieceInitiated(piece: Piece) {
    await this.ensureLinks(piece)
  }

  @OnEvent(PieceEventEnum.created)
  async handlePieceCreated(piece: Piece) {
    await this.ensureLinks(piece)
  }

  @OnEvent(PieceEventEnum.changed)
  async handlePieceChanged(piece: Piece) {
    await this.ensureLinks(piece)
  }

  @OnEvent(PieceEventEnum.deleted)
  async handlePieceDeleted(piece: Piece) {
    await this.removeLinks(piece)
  }
}
