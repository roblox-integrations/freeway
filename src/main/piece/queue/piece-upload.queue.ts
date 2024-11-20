import {ConfigurationPiece} from '@main/_config/configuration'
import {Injectable} from '@nestjs/common'
import {BaseQueue} from './base.queue'

export interface PieceUploadPayload {
  run: (t: any) => Promise<any>
}

@Injectable()
export class PieceUploadQueue extends BaseQueue<PieceUploadPayload> {
  getOptions() {
    return this.config.get<ConfigurationPiece>('piece').watcherQueue
  }
}
