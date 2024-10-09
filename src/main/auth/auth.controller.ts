import {Controller, Get} from "@nestjs/common";
import {AuthService} from "./auth.service.ts";
import {IpcHandle} from "@doubleshot/nest-electron";
import {of} from "rxjs";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("/account")
  public account() {
    return this.authService.getProfile();
  }

  @IpcHandle("profile")
  public handleGetAccount() {
    return of(this.authService.getProfile());
  }
}
