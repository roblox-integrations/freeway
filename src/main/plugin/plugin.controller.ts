import {PluginService} from '@main/plugin/plugin.service'
import {Controller, Get, Post} from '@nestjs/common'

interface InstallPluginRequest {
  result: boolean
}

@Controller('api/plugins')
export class PluginController {
  constructor(
    private readonly service: PluginService,
  ) {
  }

  @Post('/install-studio-plugin')
  public async installStudioPlugin(): Promise<InstallPluginRequest> {
    return {
      result: await this.service.installStudioPlugin(),
    }
  }

  @Get('/status')
  public async status() {
    return this.service.getStatus()
  }
}
