import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('version')
  getVersion() {
    const v = process.env.APP_VERSION || '1.0.0';
    console.log('NestJS enviando versión:', v); // Esto se verá en tu terminal negra (backend)
    return { version: v };
  }
}