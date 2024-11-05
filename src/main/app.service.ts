import {join} from 'node:path'
import process from 'node:process'
import {is} from '@electron-toolkit/utils'
import {Injectable} from '@nestjs/common'

@Injectable()
export class AppService {
  public getTime(): number {
    return new Date().getTime()
  }

  static getAppUrl() {
    if (is.dev && process.env.ELECTRON_RENDERER_URL) {
      return process.env.ELECTRON_RENDERER_URL
    }

    return `file://${join(__dirname, '../renderer/index.html')}`
  }
}
