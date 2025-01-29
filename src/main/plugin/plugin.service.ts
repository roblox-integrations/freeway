import path from 'node:path'
import {RESOURCES_DIR} from '@main/utils'
import {Injectable, Logger} from '@nestjs/common'
import {studioPluginsPath} from '@roblox-integrations/roblox-install'
import fse from 'fs-extra'

const STUDIO_PLUGIN_NAME = 'Freeway.rbxm'

@Injectable()
export class PluginService {
  private readonly logger = new Logger(PluginService.name)

  async installStudioPlugin() {
    const src = this.getStudioPluginSrc()
    const dest = this.getStudioPluginDest()
    this.logger.log(`install studio plugin ${src} -> ${dest}`)
    return fse.copy(src, dest)
  }

  getStudioPluginSrc() {
    return path.join(RESOURCES_DIR, STUDIO_PLUGIN_NAME)
  }

  getStudioPluginDest() {
    return path.join(studioPluginsPath(), STUDIO_PLUGIN_NAME)
  }
}
