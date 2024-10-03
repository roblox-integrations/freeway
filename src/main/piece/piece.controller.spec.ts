import { Test, TestingModule } from '@nestjs/testing';
import { PieceController } from './piece.controller';

describe('PieceController', () => {
  let controller: PieceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PieceController],
    }).compile();

    controller = module.get<PieceController>(PieceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
