import type {MicroserviceOptions} from '@nestjs/microservices'
import process from 'node:process'
import {ElectronIpcTransport} from '@doubleshot/nest-electron'
import {ValidationPipe} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {NestFactory} from '@nestjs/core'
import {app} from 'electron'
import {ConfigurationCors, ConfigurationMain} from './_config/configuration'
import {AppModule} from './app.module'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

async function bootstrap() {
  try {
    await app.whenReady()

    const nestApp = await NestFactory.create(AppModule)

    const config = nestApp.get(ConfigService)

    nestApp.enableCors(config.get<ConfigurationCors>('cors'))

    nestApp.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    )

    // global middleware
    // nestApp.use((req, res, next) => {
    //   console.log('global middleware');
    //   next();
    // })

    nestApp.connectMicroservice<MicroserviceOptions>({
      strategy: new ElectronIpcTransport('IpcTransport'),
    })

    nestApp.enableShutdownHooks()
    await nestApp.startAllMicroservices()

    const mainConfig = config.get<ConfigurationMain>('main')
    await nestApp.listen(mainConfig.port, mainConfig.host)

    const isDev = !app.isPackaged
    app.on('window-all-closed', async () => {
      if (process.platform !== 'darwin') {
        await nestApp.close()
        app.quit()
      }
    })

    if (isDev) {
      if (process.platform === 'win32') {
        process.on('message', async (data) => {
          if (data === 'graceful-exit') {
            await nestApp.close()
            app.quit()
          }
        })
      }
      else {
        process.on('SIGTERM', async () => {
          await nestApp.close()
          app.quit()
        })
      }
    }
  }
  catch (error) {
    console.log(error)
    app.quit()
  }
}

bootstrap()
