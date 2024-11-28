import {join} from 'node:path'
import process from 'node:process'
import {ELECTRON_WINDOW_DEFAULT_NAME, ElectronModule} from '@doubleshot/nest-electron'
import {Module} from '@nestjs/common'
import {ConfigModule} from '@nestjs/config'
import {EventEmitterModule} from '@nestjs/event-emitter'
import {app, BrowserWindow, shell} from 'electron'
import icon from '../../resources/icon.png?asset'
import {configuration} from './_config/configuration'
import {AppController} from './app.controller'
import {AppService} from './app.service'
import {AuthModule} from './auth/auth.module'
import {PieceModule} from './piece/piece.module'
import {RobloxApiModule} from './roblox-api/roblox-api.module'
import {TestModule} from './test/test.module'

// import { RobloxApiServiceService } from './roblox-api-service/roblox-api-service.service';

const electronModule = ElectronModule.registerAsync({
  name: ELECTRON_WINDOW_DEFAULT_NAME,
  isGlobal: true,
  useFactory: async () => {
    const isDev = !app.isPackaged

    const width = isDev ? 1024 + 500 : 1024 // make window a bit wider when dev
    const height = 768

    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width,
      height,
      show: false,
      autoHideMenuBar: isDev,
      icon: join(__dirname, '../../resources/icon.ico'),
      title: 'Roblox Integration Hub',
      frame: true,
      ...(process.platform === 'linux' ? {icon} : {}),
      webPreferences: {
        contextIsolation: true,
        preload: join(__dirname, '../preload/index.mjs'),
        sandbox: false,
      },
    })

    mainWindow.on('ready-to-show', () => {
      mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return {action: 'deny'}
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    await mainWindow.loadURL(AppService.getAppUrl())

    if (isDev) {
      mainWindow.webContents.openDevTools()
      // mainWindow.maximize()
    }

    return mainWindow
  },
})

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    electronModule,
    AuthModule,
    TestModule,
    RobloxApiModule,
    PieceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
