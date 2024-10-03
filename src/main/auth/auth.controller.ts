import {Controller, Get} from "@nestjs/common";
import {AuthService} from "./auth.service.ts";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @Get("/auth")
  public root() {
    return {message: "hello from auth"};
  }

  @Get("/account")
  public account() {
    return this.authService.getProfile();
  }

  @Get("/account2")
  public account2() {
    return this.authService.getProfile();
  }
}
