import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.ts';
import { AuthService } from './auth.service.ts';
import {RobloxApiModule} from "@main/roblox-api/roblox-api.module.ts";

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
  imports: [RobloxApiModule],
})
export class AuthModule {}
