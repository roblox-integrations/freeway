export class CreateAssetResultDto {
  assetId: string
  decalId: string
  operationId: string

  static fromDto (obj: CreateAssetResultDto) {
    const dto = new CreateAssetResultDto();
    Object.assign(dto, obj);
    return dto;
  }
}
