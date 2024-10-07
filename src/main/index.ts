import type { MicroserviceOptions } from '@nestjs/microservices'
import { ElectronIpcTransport } from '@doubleshot/nest-electron'
import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { app } from 'electron'
import { AppModule } from './app.module'

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
    }
    else {
      process.on('SIGTERM', () => {
        app.quit()
      })
    }
  }

  await app.whenReady()
}

/*
async function bootstrap() {
  try {
    await electronAppInit()

    const nestApp = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        strategy: new ElectronIpcTransport('IpcTransport'),
      },
    )

    await nestApp.listen()
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    app.quit()
  }
}
*/

async function bootstrap2() {
  try {
    await electronAppInit()
    const app = await NestFactory.create(AppModule,  {
      cors: {
        "origin": "*",
        "methods": "*",
        "preflightContinue": false,
        "optionsSuccessStatus": 204
      }
    })

    app.use((req, res, next) => {
      console.log('global middleware');
      next();
    })

    app.connectMicroservice<MicroserviceOptions>({
      strategy: new ElectronIpcTransport('IpcTransport'),
    })

    await app.startAllMicroservices()

    const config = app.get(ConfigService)
    const port = config.get<number>('port');
    await app.listen(port)
    console.log(`[app] started on ${port}`);
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    app.quit()
  }
}

bootstrap2()
