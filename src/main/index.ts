import type {MicroserviceOptions} from '@nestjs/microservices'
import {ElectronIpcTransport} from '@doubleshot/nest-electron'
import {NestFactory} from '@nestjs/core'
import {ValidationPipe} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {app} from 'electron'
import {AppModule} from './app.module'
import {ConfigurationCors} from './_config/configuration'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

async function electronAppInit() {
  const isDev = !app.isPackaged
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
      app.quit()
  })

  if (isDev) {
    if (process.platform === 'win32') {
      process.on('message', (data) => {
        if (data === 'graceful-exit')
          app.quit()
      })
    } else {
      process.on('SIGTERM', () => {
        app.quit()
      })
    }
  }

  await app.whenReady()
}

async function main() {
  try {
    await electronAppInit()
    const app = await NestFactory.create(AppModule);

    const config = app.get(ConfigService)

    app.enableCors(config.get<ConfigurationCors>('cors'))

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );

    // global middleware
    // app.use((req, res, next) => {
    //   console.log('global middleware');
    //   next();
    // })

    app.connectMicroservice<MicroserviceOptions>({
      strategy: new ElectronIpcTransport('IpcTransport'),
    })

    await app.startAllMicroservices()

    const port = config.get<number>('port');
    await app.listen(port)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    app.quit()
  }
}

main()
