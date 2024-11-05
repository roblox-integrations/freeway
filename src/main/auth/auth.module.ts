import {RobloxApiModule} from '@main/roblox-api/roblox-api.module'
import {Module} from '@nestjs/common'
import {AuthController} from './auth.controller'
import {AuthService} from './auth.service'

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
  imports: [RobloxApiModule],
})
export class AuthModule {}
