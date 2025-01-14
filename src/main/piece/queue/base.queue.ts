import {Operation, PBetterQueue} from '@common/queue/PBetterQueue'
import {PieceProvider} from '@main/piece/piece.provider'
import {Injectable} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import pRetry from 'p-retry'
import Result = Electron.Result

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

  constructor(protected readonly provider: PieceProvider, protected readonly config: ConfigService) {
    this.queue = this.createQueue()
  }

  createQueue() {
    const options = this.getOptions()

    const queue = new PBetterQueue({
      concurrency: options.concurrency,
      delay: options.delay,
      process: async (payload: Payload, operation: Operation) => {
        return pRetry(
          async (attemptNumber) => {
            return this.onRun(payload, operation, attemptNumber)
          },
          {
            onFailedAttempt: (err) => {
              this.onError(err, payload, operation)
            },
            retries: options.retries,
          },
        )
      },
    })

    queue.on('idle', () => {
      this.onIdle()
    })

    return queue
  }

  getOptions(): BaseOptions {
    return {
      delay: 0,
      concurrency: 1,
      retries: 0,
    }
  }

  push<Result>(id: string, task: Payload): Promise<Result> {
    return this.queue.addOperation<Result>(id, task)
  }

  onRun(payload: Payload, _operation: Operation, _attemptNumber: number): Promise<Result> | Result {
    return payload.run(payload)
  }

  onError(_err: any, _payload: Payload, _operation: Operation) {
    //
  }

  onIdle() {
    //
  }
}
