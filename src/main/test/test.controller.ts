import {Controller, Get} from "@nestjs/common";

@Controller('api')
export class TestController {
  @Get('test')
  test () {
    return {date: new Date()};
  }
}
