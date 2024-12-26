import type {MicroserviceOptions} from '@nestjs/microservices'
import process from 'node:process'
import {ElectronIpcTransport} from '@doubleshot/nest-electron'
import {ValidationPipe} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {NestFactory} from '@nestjs/core'
import {app as electronApp} from 'electron'
import {json, urlencoded} from 'express'
import {ConfigurationCors, ConfigurationMain} from './_config/configuration'
import {AppModule} from './app.module'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

async function bootstrap() {
  try {
    await electronApp.whenReady()

    const app = await NestFactory.create(AppModule)

    const config = app.get(ConfigService)

    app.enableCors(config.get<ConfigurationCors>('cors'))

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    )

    app.use(json({limit: '250mb'}))
    app.use(urlencoded({extended: true, limit: '250mb'}))

    // global middleware
    // app.use((req, res, next) => {
    //   console.log('global middleware');
    //   next();
    // })

    app.connectMicroservice<MicroserviceOptions>({
      strategy: new ElectronIpcTransport('IpcTransport'),
    })

    app.enableShutdownHooks()
    await app.startAllMicroservices()

    const mainConfig = config.get<ConfigurationMain>('main')
    await app.listen(mainConfig.port, mainConfig.host)

    const isDev = !electronApp.isPackaged
    electronApp.on('window-all-closed', async () => {
      if (process.platform !== 'darwin') {
        await app.close()
        electronApp.quit()
      }
    })

    if (isDev) {
      if (process.platform === 'win32') {
        process.on('message', async (data) => {
          if (data === 'graceful-exit') {
            await app.close()
            electronApp.quit()
          }
        })
      }
      else {
        process.on('SIGTERM', async () => {
          await app.close()
          electronApp.quit()
        })
      }
    }
  }
  catch (error) {
    console.log(error)
    electronApp.quit()
  }
}

bootstrap()
