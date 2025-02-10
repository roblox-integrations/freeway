import {Module} from '@nestjs/common'
import {ConfigModule} from '@nestjs/config'
import {EventEmitterModule} from '@nestjs/event-emitter'
import {ScheduleModule} from '@nestjs/schedule'
import {LoggerModule} from 'nestjs-pino'
import {configuration} from './_config/configuration'
import {AppController} from './app.controller'
import {AppService} from './app.service'
import {AuthModule} from './auth/auth.module'
import {ElectronModule} from './electron/electron.module'
import {PieceModule} from './piece/piece.module'
import {PluginModule} from './plugin/plugin.module'
import {RobloxApiModule} from './roblox-api/roblox-api.module'
import {TestModule} from './test/test.module'

@Module({
  imports: [
    LoggerModule.forRoot({
      name: 'add some name to every JSON line',
      level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      prettyPrint: true,
      useLevelLabels: true,
      // and all the others...
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    TestModule,
    RobloxApiModule,
    PieceModule,
    PluginModule,
    ElectronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
