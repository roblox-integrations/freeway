import PQueue, {QueueAddOptions as PQueueAddOptions, Options as PQueueConstructorOptions, Queue} from 'p-queue'
import type PriorityQueue from 'p-queue/dist/priority-queue'
import {type RunFunction} from 'p-queue/dist/queue'

export type OperationProcess = (payload: any, operation: Operation) => Promise<unknown> | unknown

export type OperationId = any

export enum OperationStatus {
  delayed = 'delayed',
  queued = 'queued',
  running = 'running',
  resolved = 'resolved',
  rejected = 'rejected',
}

export interface Operation {
  id: OperationId
  payload: any
  options: OperationOptions
  status: OperationStatus
  _promise: Promise<any>
  _resolve: (value?: any | PromiseLike<any>) => void
  _reject: (reason?: any) => void
  timeout?: ReturnType<typeof setTimeout>
}

export type QueueConstructorOptions<QueueType extends Queue<RunFunction, QueueOptionsType>, QueueOptionsType extends OperationOptions> = {
  delay?: number
  process?: OperationProcess
} & PQueueConstructorOptions<QueueType, QueueOptionsType>

export type OperationOptions = {
  delay?: number
  process?: OperationProcess
} & PQueueAddOptions

export class PBetterQueue<QueueType extends Queue<RunFunction, OperationOptions> = PriorityQueue> extends PQueue<QueueType, OperationOptions> {
  private operations: Map<OperationId, Operation>
  private readonly delay: number
  private readonly process: OperationProcess

  constructor(options?: QueueConstructorOptions<QueueType, OperationOptions>) {
    super(options)

    this.delay = options.delay || 0
    this.process = options.process
    this.operations = new Map()
  }

  setOperation(id: OperationId, operation: Operation) {
    this.operations.set(id, operation)
  }

  getOperation(id: OperationId): Operation | undefined {
    return this.operations.get(id)
  }

  deleteOperation(id: OperationId): boolean {
    return this.operations.delete(id)
  }

  async addOperation<OperationResultType>(id: OperationId, payload: any, options: {throwOnTimeout: true} & Exclude<OperationOptions, 'throwOnTimeout'>): Promise<OperationResultType>
  async addOperation<OperationResultType>(id: OperationId, payload: any, options?: Partial<OperationOptions>): Promise<OperationResultType | void>
  async addOperation<OperationResultType>(id: OperationId, payload: any, options: Partial<OperationOptions> = {}): Promise<OperationResultType | void> {
    let operation = this.getOperation(id)

    if (!operation) {
      operation = this.createAddOperation(id, payload, options)
      this.setOperation(operation.id, operation)
      return operation._promise
    }

    if (operation.status === OperationStatus.delayed) {
      this.mergeAddOperationNew(operation, payload, options)
    }
    else if (operation.status === OperationStatus.queued) {
      // timeout is already fired, no need to cancel it
      // operation pushed into queue, but process is not started
      // you may want to replace payload here
      // you may want to cancel operation and schedule new one
      this.mergeAddOperationQueued(operation, payload, options)
    }
    else {
      // operation was in queue, process is started
      // you may want to cancel process somehow (if it is possible)
      this.mergeAddOperationRunning(operation, payload, options)
    }

    return operation._promise
  }

  createAddOperation(id: OperationId, payload: any, options: Partial<OperationOptions>) {
    let _resolve: Operation['_resolve']
    let _reject: Operation['_reject']
    const _promise = new Promise<void>((resolve, reject) => {
      _resolve = resolve
      _reject = reject
    })

    const operation = {
      id,
      payload,
      options,
      status: OperationStatus.delayed,
      _promise,
      _resolve,
      _reject,
    }

    this.setRunOperationTimeout(operation)

    return operation
  }

  mergeAddOperationNew(_operation: Operation, _payload: any, _options: Partial<OperationOptions>) {
    this.clearRunOperationTimeout(_operation)
    this.setRunOperationTimeout(_operation)
  }

  mergeAddOperationQueued(_operation: Operation, _payload: any, _options: Partial<OperationOptions>) {
    //
  }

  mergeAddOperationRunning(_operation: Operation, _payload: any, _options: Partial<OperationOptions>) {
    //
  }

  setRunOperationTimeout(operation: Operation) {
    operation.timeout = this.createRunOperationTimeout(operation)
  }

  createRunOperationTimeout(operation: Operation) {
    const delay = operation.options?.delay || this.delay || 0
    return setTimeout(async () => {
      await this.processOperation(operation)
    }, delay)
  }

  clearRunOperationTimeout(operation: Operation) {
    clearTimeout(operation.timeout)
  }

  async processOperation(operation: Operation) {
    const process = operation.options?.process || this.process
    if (!process) {
      throw new Error('You must provide either method `addOperation` options.process or `constructor` options.process')
    }

    try {
      operation.status = OperationStatus.queued
      const result = await this.add(
        () => {
          operation.status = OperationStatus.running
          return process(operation.payload, operation)
        },
        operation.options,
      )
      operation.status = OperationStatus.resolved
      operation._resolve(result)
    }
    catch (err) {
      operation.status = OperationStatus.rejected
      operation._reject(err)
    }
    finally {
      this.deleteOperation(operation.id)
    }
  }

  get delayed(): number {
    return this.operations.size
  }
}

export default PBetterQueue
