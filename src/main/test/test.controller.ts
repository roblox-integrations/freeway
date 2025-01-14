import {join} from 'node:path'
import process from 'node:process'
import {is} from '@electron-toolkit/utils'
import {Controller, Get} from '@nestjs/common'
import {studioContentPath} from '@roblox-integrations/roblox-install'
import {app} from 'electron'

@Controller('api')
export class TestController {
  @Get('test')
  test() {
    if (!is.dev) {
      return {
        date: new Date(),
      }
    }

    return {
      'date': new Date(),
      'process.resourcesPath': process.resourcesPath,
      'app.getAppPath()': app.getAppPath(),
      '__dirname': __dirname,
      'resourceDirDev': join(__dirname, '../../resources'),
      'resourceDirProd': process.resourcesPath,
      'studioContentPath': studioContentPath(),
      'version': process.version,
    }
  }
}
