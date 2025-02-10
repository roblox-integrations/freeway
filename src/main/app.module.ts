import {Module, RequestMethod} from '@nestjs/common'
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
import pino from 'pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      name: 'add some name to every JSON line',
      prettyPrint: true,
      useLevelLabels: true,
      pinoHttp: {
        stream: pino.destination({
          dest: './my-file.log', // omit for stdout
          minLength: 4096, // Buffer before writing
          sync: false, // Asynchronous logging
        }),
      },
      exclude: [{method: RequestMethod.ALL, path: '/api'}],
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
