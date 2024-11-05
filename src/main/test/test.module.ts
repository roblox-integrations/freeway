import {Module} from '@nestjs/common'
import {TestController} from './test.controller'
import {Test} from './test'

@Module({
  controllers: [TestController],
  providers: [Test],
})
export class TestModule {}
