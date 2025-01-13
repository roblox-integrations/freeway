import {RobloxApiModule} from '@main/roblox-api/roblox-api.module'
import {Global, Module} from '@nestjs/common'
import {ElectronController} from './electron.controller'
import {ElectronService} from './electron.service'

@Global()
@Module({
  providers: [ElectronService],
  controllers: [ElectronController],
  exports: [ElectronService],
  imports: [RobloxApiModule],
})
export class ElectronModule {}
