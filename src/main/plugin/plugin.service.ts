import path from 'node:path'
import {is} from '@electron-toolkit/utils'
import {RESOURCES_DIR} from '@main/utils'
import {Injectable, Logger, OnApplicationBootstrap} from '@nestjs/common'
import {studioPluginsPath} from '@roblox-integrations/roblox-install'
import fse from 'fs-extra'

const STUDIO_PLUGIN_NAME = 'Freeway.rbxm'

@Injectable()
export class PluginService implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    if (!is.dev) {
      // do not install plugin automatically on app start for now
    }
    else {
      await this.installStudioPlugin()
    }
  }

  private readonly logger = new Logger(PluginService.name)

  async installStudioPlugin() {
    const src = this.getStudioPluginSrc()
    const dest = this.getStudioPluginDest()
    try {
      await fse.copy(src, dest)
      this.logger.log(`Installed studio plugin ${src} -> ${dest}`)
      return true
    }
    catch (err: any) {
      this.logger.error(`Cannot install studio plugin ${src} -> ${dest}`, err)
      return false
    }
  }

  getStudioPluginSrc() {
    return path.join(RESOURCES_DIR, STUDIO_PLUGIN_NAME)
  }

  getStudioPluginDest() {
    return path.join(studioPluginsPath(), STUDIO_PLUGIN_NAME)
  }

  async getStatus() {
    return {
      isStudioPluginInstalled: await this.getIsStudioPluginInstalled(),
    }
  }

  async getIsStudioPluginInstalled() {
    try {
      await fse.stat(this.getStudioPluginDest())
      return true
    }
    catch (err: any) {
      if (err.code === 'ENOENT') {
        return false
      }
      throw err
    }
  }
}
