import PQueue from '@esm2cjs/p-queue'

export default function (options): PQueue {
  // @ts-ignore
  return new PQueue.default(options)
};
