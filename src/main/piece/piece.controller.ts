import { Controller, Get, Param, Query } from "@nestjs/common";
import { PieceService } from "@main/piece/piece.service.ts";

@Controller('api/pieces')
export class PieceController {
  constructor(private readonly pieceService: PieceService) {  }
  @Get("/")
  findAll () {
    return this.pieceService.getAll();
  }

  @Get("/:id")
  get (@Param('id') id: string) {
    return this.pieceService.getPieceById(id);
  }

  @Get("/:id/pngjs")
  getPngjs (@Param('id') id: string) {
    return this.pieceService.getPieceByIdEditablePngjs(id);
  }
}
