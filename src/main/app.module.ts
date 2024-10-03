import { join } from 'node:path'
import { ElectronModule } from '@doubleshot/nest-electron'
import { AuthModule } from '@main/auth/auth.module'
import { TestModule } from '@main/test/test.module'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { app, BrowserWindow } from 'electron'
import { configuration } from './_config/configuration'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PieceModule } from './piece/piece.module.ts'

const electronModule = ElectronModule.registerAsync({
  useFactory: async () => {
    const isDev = !app.isPackaged

    const width = isDev ? 1024 + 300 : 1024 // make window a bit wider when dev
    const height = 768

    const browserWindow = new BrowserWindow({
      width,
      height,

      icon: join(__dirname, '../../resources/icon.ico'),
      title: 'Roblox Integration Hub',

      // autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        preload: join(__dirname, '../preload/index.js'),
      },
    })

    browserWindow.on('closed', () => {
      browserWindow.destroy()
    })

    if (isDev) {
      browserWindow.webContents.openDevTools() // open dev tools when dev
    }

    const URL = isDev
      ? process.env.DS_RENDERER_URL
      : `file://${join(app.getAppPath(), 'dist/render/index.html')}`

    console.log(`[app] path: ${app.getAppPath()}`)

    await browserWindow.loadURL(URL)

    return { win: browserWindow, URL }
  },
})

@Module({
  imports: [
    electronModule,
    AuthModule,
    TestModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PieceModule.register({
      metadataPath: join(__dirname, '../../metadata.json'),
      filesPath: join(__dirname, '../../files')
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
}
