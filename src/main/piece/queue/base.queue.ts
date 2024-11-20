import {Operation, PBetterQueue} from '@common/queue/PBetterQueue'
import {PieceProvider} from '@main/piece/piece.provider'
import {Injectable, Logger} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import pRetry from 'p-retry'

export interface BasePayload<Payload> {
  run: (task: Payload) => Promise<any>
}

export interface BaseOptions {
  delay: number
  concurrency: number
  retries: number
}

@Injectable()
export abstract class BaseQueue<Payload extends BasePayload<Payload>> {
  protected queue: PBetterQueue
  protected readonly logger = new Logger(BaseQueue.name)

  constructor(protected readonly provider: PieceProvider, protected readonly config: ConfigService) {
    const options = this.getOptions()

    const process = async (payload: Payload, operation: Operation) => {
      return pRetry(
        async (attemptNumber) => {
          return this.run(payload, operation, attemptNumber)
        },
        {
          onFailedAttempt: (err) => {
            this.onFailedAttempt(err, payload, operation)
          },
          retries: options.retries,
        },
      )
    }

    this.queue = new PBetterQueue({
      concurrency: options.concurrency,
      delay: options.delay,
      process,
    })

    this.queue.on('idle', () => {
      this.onIdle()
    })
  }

  getOptions(): BaseOptions {
    return {
      delay: 0,
      concurrency: 1,
      retries: 0,
    }
  }

  push<Result>(id: string, task: Payload) {
    return this.queue.addOperation<Result>(id, task)
  }

  onIdle() {
    //
  }

  run(payload: Payload, _operation: Operation, _attemptNumber: number) {
    return payload.run(payload)
  }

  onFailedAttempt(err: any, _payload: Payload, _operation: Operation) {
    this.logger.error(err)
  }
}
