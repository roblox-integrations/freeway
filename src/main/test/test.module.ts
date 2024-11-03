import {Module} from '@nestjs/common'
import {TestController} from './test.controller.ts'
import {Test} from './test.ts'

@Module({
  controllers: [TestController],
  providers: [Test],
})
export class TestModule {}
