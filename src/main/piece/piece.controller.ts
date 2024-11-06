import {createReadStream} from 'node:fs'
import {join} from 'node:path'
import process from 'node:process'
import {UpdatePieceDto} from '@main/piece/dto/update-piece.dto'
import {PieceTypeEnum} from '@main/piece/enum'
import {PieceService} from '@main/piece/piece.service'
import {RobloxApiService} from '@main/roblox-api/roblox-api.service'
import {getMime} from '@main/utils'
import {Body, Controller, Get, Param, Patch, Post, StreamableFile} from '@nestjs/common'
import {app} from 'electron'

@Controller('api/pieces')
export class PieceController {
  constructor(private readonly pieceService: PieceService, private readonly robloxApiService: RobloxApiService) {
  }

  @Get('/')
  async findAll() {
    return this.pieceService.getAll()
  }

  @Get('/:id')
  async get(@Param('id') id: string) {
    return this.pieceService.getPieceById(id)
  }

  @Get('/:id/raw')
  async getRaw(@Param('id') id: string) {
    return this.pieceService.getPieceByIdBase64(id)
  }

  @Get('/:id/preview')
  async getPreview(@Param('id') id: string): Promise<StreamableFile> {
    const piece = this.pieceService.getPieceById(id)

    let filePath: string
    if (piece.type === PieceTypeEnum.image) {
      filePath = piece.filePath
    }
    else {
      const isDev = !app.isPackaged
      const staticDir = isDev
        ? join(__dirname, '../../static')
        : join(process.resourcesPath, 'static')

      filePath = join(staticDir, 'preview-placeholder.png')
    }

    const file = createReadStream(filePath)

    return new StreamableFile(file, {
      type: getMime(piece.filePath),
    })
  }

  @Patch('/:id')
  async update(@Param('id') id: string, @Body() updatePieceDto: UpdatePieceDto) {
    const piece = this.pieceService.getPieceById(id)

    await this.pieceService.update(piece, updatePieceDto)
    await this.pieceService.flush()

    return piece
  }

  @Post('/:id/asset')
  async createAsset(@Param('id') id: string) {
    const piece = this.pieceService.getPieceById(id)
    await this.pieceService.uploadAsset(piece)
    await this.pieceService.flush()
    return piece
  }

  @Get('/:id/operation')
  async getOperation(@Param('id') id: string) {
    return this.robloxApiService.getAssetOperationResultRetry(id)
  }

  @Get('/:id/decal')
  async getFromDecal(@Param('id') id: string) {
    return this.robloxApiService.getImageFromDecal(id)
  }
}
