import {createReadStream} from 'node:fs'
import {UpdatePieceDto} from '@main/piece/dto/update-piece.dto'
import {PieceService} from '@main/piece/piece.service'
import {PieceNotificationService} from '@main/piece/piece-notification.service'
import {RobloxApiService} from '@main/roblox-api/roblox-api.service'
import {Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile} from '@nestjs/common'

@Controller('api/pieces')
export class PieceController {
  constructor(
    private readonly pieceService: PieceService,
    private readonly pieceNotificationService: PieceNotificationService,
    private readonly robloxApiService: RobloxApiService,
  ) {
  }

  @Get('/')
  async find(@Query() query: any) {
    const criteria = {...query, ...{deletedAt: null}}
    return this.pieceService.findMany(criteria)
  }

  @Get('/notify')
  async notify() {
    return this.pieceNotificationService.notify()
  }

  @Get('/:id')
  async get(@Param('id') id: string) {
    return this.pieceService.getPieceById(id)
  }

  @Get('/:id/raw')
  async getRaw(@Param('id') id: string) {
    return this.pieceService.getRaw(id)
  }

  @Get('/:id/preview')
  async getPreview(@Param('id') id: string): Promise<StreamableFile> {
    const piece = this.pieceService.getPieceById(id)

    const file = createReadStream(this.pieceService.getPiecePreviewPath(piece))

    return new StreamableFile(file, {
      type: this.pieceService.getPieceMime(piece),
    })
  }

  @Patch('/:id')
  async update(@Param('id') id: string, @Body() updatePieceDto: UpdatePieceDto) {
    const piece = this.pieceService.getPieceById(id)

    await this.pieceService.update(piece, updatePieceDto)

    return piece
  }

  @Delete('/:id')
  async delete(@Param('id') id: string) {
    const piece = this.pieceService.getPieceById(id)
    await this.pieceService.delete(piece)
    return piece
  }

  @Post('/:id/asset')
  async createAsset(@Param('id') id: string) {
    const piece = this.pieceService.getPieceById(id)
    await this.pieceService.queueUploadAsset(piece)
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
