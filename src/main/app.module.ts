import {Module} from '@nestjs/common'
import {ConfigModule} from '@nestjs/config'
import {EventEmitterModule} from '@nestjs/event-emitter'
import {ScheduleModule} from '@nestjs/schedule'
import {configuration} from './_config/configuration'
import {AppController} from './app.controller'
import {AppService} from './app.service'
import {AuthModule} from './auth/auth.module'
import {ElectronModule} from './electron/electron.module'
import {PieceModule} from './piece/piece.module'
import {RobloxApiModule} from './roblox-api/roblox-api.module'
import {TestModule} from './test/test.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    ScheduleModule.forRoot(),
    ElectronModule,
    AuthModule,
    TestModule,
    RobloxApiModule,
    PieceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
