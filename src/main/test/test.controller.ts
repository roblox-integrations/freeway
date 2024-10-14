import {Controller, Get} from "@nestjs/common";
import {app} from 'electron'
import {join} from "node:path";

@Controller('api')
export class TestController {
  @Get('test')
  test () {
    return {
      date: new Date(),
      'process.resourcesPath': process.resourcesPath,
      'electron.app': app.getAppPath(),
      '__dirname': __dirname,
      resourceDirDEV: join(__dirname, '../../resources'),
      resourceDirProd: process.resourcesPath
    };
  }
}
