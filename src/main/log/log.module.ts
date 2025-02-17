import {ConfigurationLog} from '@main/_config/configuration'
import {Module} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {utilities as nestWinstonModuleUtilities, WinstonModule} from 'nest-winston'
import * as winston from 'winston'
import WinstonDailyRotateFile from 'winston-daily-rotate-file'

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const conf = configService.get<ConfigurationLog>('log')

        const transports = []

        if (conf.isConsoleTransportEnabled) {
          transports.push(new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              nestWinstonModuleUtilities.format.nestLike('Freeway', {
                colors: true,
                prettyPrint: true,
                processId: true,
                appName: false,
              }),
            ),
          }))
        }

        if (conf.isFileTransportEnabled) {
          transports.push(new WinstonDailyRotateFile({
            level: 'info',
            filename: 'application-%DATE%.log',
            datePattern: 'YYYY-MM-DD-HH',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '7d',
            dirname: conf.directory,
          }))
        }

        return {
          transports,
          // other options
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class LogModule {}
