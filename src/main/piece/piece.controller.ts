import { Controller, Get } from "@nestjs/common";
import { PieceService } from "@main/piece/piece.service.ts";

@Controller('api/pieces')
export class PieceController {
  constructor(private readonly pieceService: PieceService) {  }
  @Get("/")
  findAll () {
    return this.pieceService.getAll();
  }
}
