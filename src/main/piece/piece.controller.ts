import {Controller, Get, Post, Patch, Param, Query, Body, StreamableFile} from "@nestjs/common";
import {PieceService} from "@main/piece/piece.service.ts";
import {createReadStream} from 'fs';
import {lookup} from 'mime-types';
import {PieceTypeEnum} from "@main/piece/enum";
import {join} from "node:path";
import {app} from 'electron'
import {UpdatePieceDto} from "@main/piece/dto/update-piece.dto.ts";
import {AuthService} from "@main/auth/auth.service.ts";

@Controller('api/pieces')
export class PieceController {
  constructor(private readonly pieceService: PieceService, private readonly authService: AuthService) {
  }

  @Get("/")
  async findAll() {
    return this.pieceService.getAll();
  }

  @Get("/:id")
  async get(@Param('id') id: string) {
    return this.pieceService.getPieceById(id);
  }

  @Get("/:id/dumped")
  async getJimp(@Param('id') id: string, @Query('r') round: number) {
    console.log(typeof round === 'number');
    return this.pieceService.getPieceByIdDumped(id, round);
  }

  @Get("/:id/preview")
  async getPreview(@Param('id') id: string) {
    const piece = this.pieceService.getPieceById(id);

    let filePath;
    if (piece.type === PieceTypeEnum.image) {
      filePath = piece.filePath;
    } else {
      const isDev = !app.isPackaged;
      const staticDir = isDev
        ? join(__dirname, '../../static')
        : join(process.resourcesPath, 'static')

      filePath = join(staticDir, 'preview-placeholder.png');
    }

    const file = createReadStream(filePath);

    return new StreamableFile(file, {
      type: lookup(piece.filePath) || 'application/octet-stream'
    });
  }

  @Patch("/:id")
  async update(@Param('id') id: string, @Body() updatePieceDto: UpdatePieceDto) {
    const piece = this.pieceService.getPieceById(id);

    await this.pieceService.update(piece, updatePieceDto);
    await this.pieceService.flush();

    return piece;
  }

  @Post("/:id/asset")
  async createAsset(@Param('id') id: string) {
    const piece = this.pieceService.getPieceById(id);
    await this.pieceService.uploadAsset(piece);
    await this.pieceService.flush();
    return piece;
  }

  @Get("/:id/operation")
  async getOperation(@Param('id') id: string) {
    return this.authService.getAssetOperationResultRetry(id)
  }

  @Get("/:id/decal")
  async getFromDecal(@Param('id') id: string) {
    return this.authService.getImageFromDecal(id)
  }
}
