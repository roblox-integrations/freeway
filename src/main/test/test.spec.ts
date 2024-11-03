import {Test, TestingModule} from '@nestjs/testing'
import {Test} from './test.ts'

describe('test', () => {
  let provider: Test

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Test],
    }).compile()

    provider = module.get<Test>(Test)
  })

  it('should be defined', () => {
    expect(provider).toBeDefined()
  })
})
