import {IpcOn} from '@doubleshot/nest-electron'
import {PluginService} from '@main/plugin/plugin.service'
import {Controller} from '@nestjs/common'

@Controller('plugin')
export class PluginController {
  constructor(
    private readonly service: PluginService,
  ) {
  }

  @IpcOn('install-studio-plugin')
  public async installStudioPlugin(): Promise<void> {
    return await this.service.installStudioPlugin()
  }
}
