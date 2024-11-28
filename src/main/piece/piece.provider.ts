import fs from 'node:fs/promises'
import {join, parse} from 'node:path'
import {filter as whereFilter, find as whereFind} from '@common/where'
import {ConfigurationPiece} from '@main/_config/configuration'
import {PieceExtTypeMap, PieceRoleEnum, PieceTypeEnum} from '@main/piece/enum'
import {getHash, now, randomString} from '@main/utils'
import {Injectable, Logger, UnprocessableEntityException} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {Piece} from './piece'

type PieceCriteria = any // PieceFieldCriteria | ((piece: Piece) => boolean)

@Injectable()
export class PieceProvider {
  private readonly logger = new Logger(PieceProvider.name)
  private readonly data: Piece[] = []
  private readonly options: ConfigurationPiece

  constructor(
    private readonly config: ConfigService,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')
  }

  async load() {
    try {
      await fs.access(this.options.metadataPath)
    }
    catch (accessErr: any) {
      if (accessErr.code === 'ENOENT') {
        await fs.writeFile(this.options.metadataPath, '[]') // create empty-array file
      }
      else {
        throw accessErr
      }
    }

    let data = null
    try {
      data = await fs.readFile(this.options.metadataPath, {encoding: 'utf8'})
      data = data || '[]'
    }
    catch (readErr) {
      console.error(readErr)
      throw new Error(`File ${this.options.metadataPath} does not exist`)
    }

    try {
      data = JSON.parse(data)
    }
    catch (parseErr) {
      console.error(parseErr)
      throw new Error(`Cannot parse JSON file ${this.options.metadataPath}`)
    }

    if (Array.isArray(data)) {
      for (const x of data) {
        this.data.push(Piece.fromObject(x))
      }
    }
    else {
      throw new TypeError('Invalid metadata format')
    }
  }

  async save(): Promise<void> {
    try {
      const data = JSON.stringify(this.data, null, 2)
      await fs.writeFile(this.options.metadataPath, data, {encoding: 'utf8', flush: true})
    }
    catch (writeErr) {
      console.error(writeErr)
      throw new Error(`File ${this.options.metadataPath} cannot write file`)
    }
  }

  findMany(criteria: PieceCriteria): Piece[] {
    return whereFilter<Piece>(this.data, criteria)
  }

  findOne(criteria: PieceCriteria): Piece | undefined {
    return whereFind<Piece>(this.data, criteria)
  }

  add(piece: Piece): void {
    this.data.push(piece)
  }

  remove(piece: Piece): void {
    piece.deletedAt = now()
  }

  async createFromFile(dir: string, name: string, role = PieceRoleEnum.asset) {
    const f = join(dir, name)
    const id = this.generateUniqId()
    const hash = await getHash(f)
    const parsed = parse(f)
    const type = PieceExtTypeMap.get(parsed.ext) || PieceTypeEnum.unknown as PieceTypeEnum
    const isDirty = false

    const newPiece = Piece.fromObject({
      id,
      dir,
      name,
      role,
      type,
      hash,
      isDirty,
    })

    this.add(newPiece)

    return newPiece
  }

  async updateFromFile(piece: Piece) {
    piece.isDirty = false

    const hash = await getHash(piece.fullPath)
    if (hash !== piece.hash) {
      piece.hash = hash
      piece.updatedAt = now()
    }

    if (piece.deletedAt !== null) {
      piece.deletedAt = null
      piece.updatedAt = now()
    }

    return piece
  }

  private generateUniqId() {
    for (let i = 0; ; i++) {
      const id = randomString(Math.floor(i / 10 + 4))
      if (!this.findOne({id})) {
        return id
      }
    }
  }

  async delete(piece: Piece) {
    try {
      await fs.unlink(piece.fullPath)
      this.remove(piece)
      // TODO ES remove completely

      // const pos = this.data.indexOf(piece)
      // if (pos !== -1) {
      //   this.data.splice(pos, 1)
      // }

      return piece
    }
    catch (err) {
      this.logger.error(`Error deleting piece: ${piece.fullPath}`, err)
      throw new UnprocessableEntityException(err)
    }
  }
}
