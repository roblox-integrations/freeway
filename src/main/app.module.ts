import {join} from 'node:path'
import process from 'node:process'
import {ELECTRON_WINDOW_DEFAULT_NAME, ElectronModule} from '@doubleshot/nest-electron'
import {is} from '@electron-toolkit/utils'
import {Module} from '@nestjs/common'
import {ConfigModule} from '@nestjs/config'
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
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 900,
      height: 670,
      show: false,
      autoHideMenuBar: true,
      frame: true,
      ...(process.platform === 'linux' ? {icon} : {}),
      webPreferences: {
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
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    }
    else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
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
    electronModule,
    AuthModule,
    TestModule,
    RobloxApiModule,
    PieceModule.registerAsync({
      workingDir: join(app.getPath('home'), 'roblox-electron-hub'),
      metadataPath: join(app.getPath('home'), 'roblox-electron-hub', '/metadata.json'),
      defaultWatchPath: join(app.getPath('home'), 'roblox-electron-hub', '/files'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {
}
