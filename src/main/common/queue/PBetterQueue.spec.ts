import {PBetterQueue} from './PBetterQueue'

function delay(millis: number) {
  return new Promise(resolve => setTimeout(resolve, millis))
}

describe('p-better-queue', () => {
  const multiplyByTwo = async (_payload) => {
    await delay(100)
    return _payload * 2
  }

  const process = jest.fn(multiplyByTwo)
  const then = jest.fn()

  const sumQueue = new PBetterQueue({
    delay: 200,
    concurrency: 1,
    process,
  })

  it('should be defined', async () => {
    expect(sumQueue).toBeDefined()
    expect(sumQueue.size).toBe(0)

    sumQueue.addOperation(1, 1).then(then)
    sumQueue.addOperation(1, 1).then(then)

    expect(sumQueue.size).toBe(0)
    expect(sumQueue.delayed).toBe(1)

    sumQueue.addOperation(2, 2).then(then)

    expect(sumQueue.size).toBe(0)
    expect(sumQueue.delayed).toBe(2)

    await delay(200)
    expect(sumQueue.delayed).toBe(2)
    expect(sumQueue.pending).toBe(1)

    await delay(150)
    expect(sumQueue.delayed).toBe(1)
    expect(sumQueue.pending).toBe(1)

    await delay(100)
    expect(sumQueue.delayed).toBe(0)
    expect(sumQueue.pending).toBe(0)

    expect(process.mock.calls).toHaveLength(2)
    await expect(process.mock.results[1].value).resolves.toBe(4)

    expect(then.mock.calls).toHaveLength(3)
  })
})
