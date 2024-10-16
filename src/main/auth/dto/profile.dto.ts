import {ProfileOauthDto} from "@main/auth/dto/profile.oauth.dto.ts";

export class ProfileDto {
  constructor(
    public id: string,
    public name: string,
    public nickname: string,
    public preferredUsername: string,
    public profile: string,
    public picture: string,
    public createdAt: number,
  ) {
  }

  static createFromProfileOAuthDto(dto: ProfileOauthDto): ProfileDto {
    return new ProfileDto(
      dto.sub,
      dto.name,
      dto.nickname,
      dto.preferred_username,
      dto.profile,
      dto.picture,
      dto.created_at
    )
  }
}
