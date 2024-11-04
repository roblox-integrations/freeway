import {Test, TestingModule} from '@nestjs/testing'
import {Test as MyTest} from './test'

describe('test', () => {
  let provider: MyTest

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyTest],
    }).compile()

    provider = module.get<MyTest>(MyTest)
  })

  it('should be defined', () => {
    expect(provider).toBeDefined()
  })
})
