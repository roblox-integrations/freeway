import process from 'node:process'
import {RESOURCES_DIR, STUDIO_LINKS_DIR, STUDIO_PLUGINS_DIR} from '@main/utils'
import {Controller, Get} from '@nestjs/common'
import {app} from 'electron'

@Controller('api')
export class TestController {
  @Get('test')
  test() {
    return {
      date: new Date(),
      nodeVersion: process.version,
      appVersion: app.getVersion(),
      resourceDir: RESOURCES_DIR,
      studioLinksDir: STUDIO_LINKS_DIR,
      studioPluginsDir: STUDIO_PLUGINS_DIR,

      // 'process.resourcesPath': process.resourcesPath,
      // 'app.getAppPath()': app.getAppPath(),
      // '__dirname': __dirname,
      // 'resourceDirDev': join(__dirname, '../../resources'),
      // 'resourceDirProd': process.resourcesPath,
      // 'studioContentPath': studioContentPath(),
    }
  }
}
