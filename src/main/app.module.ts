import { join } from 'node:path'
import { ElectronModule, ELECTRON_WINDOW_DEFAULT_NAME } from '@doubleshot/nest-electron'
import { AuthModule } from '@main/auth/auth.module'
import { TestModule } from '@main/test/test.module'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'
import { app, BrowserWindow } from 'electron'
import { configuration } from './_config/configuration'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PieceModule } from './piece/piece.module.ts'
import { RobloxApiModule } from './roblox-api/roblox-api.module';
// import { RobloxApiServiceService } from './roblox-api-service/roblox-api-service.service';
import { ProfileModule } from './profile/profile.module';

const electronModule = ElectronModule.registerAsync({
  name:  ELECTRON_WINDOW_DEFAULT_NAME,
  isGlobal: true,
  useFactory: async () => {
    const isDev = !app.isPackaged

    const width = isDev ? 1024 + 500 : 1024 // make window a bit wider when dev
    const height = 768

    const browserWindow = new BrowserWindow({
      width,
      height,

      icon: join(__dirname, '../../resources/icon.ico'),
      title: 'Roblox Integration Hub',

      autoHideMenuBar: isDev,
      webPreferences: {
        contextIsolation: true,
        preload: join(__dirname, '../preload/index.cjs'),
      },
    })

    browserWindow.on('closed', () => {
      browserWindow.destroy()
    })

    const URL = isDev
      ? process.env.DS_RENDERER_URL
      : `file://${join(app.getAppPath(), 'dist/render/index.html')}`

    await browserWindow.loadURL(URL)
    // browserWindow.loadURL(URL)

    if (isDev) {
      browserWindow.webContents.openDevTools() // open dev tools when dev
      browserWindow.maximize()
      // await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // return { win: browserWindow, URL }
    return browserWindow
  },
})

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    electronModule,
    AuthModule,
    TestModule,
    RobloxApiModule,
    PieceModule.registerAsync({
      metadataPath: join(app.getPath('home'), 'roblox-electron-hub', '/metadata.json'),
      defaultWatchPath: join(app.getPath('home'), 'roblox-electron-hub', '/files')
    }),
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {
}
