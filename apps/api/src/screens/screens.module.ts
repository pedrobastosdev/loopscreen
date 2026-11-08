import { Module } from '@nestjs/common';
import { ScreensController } from './screens.controller.js';
import { ScreensService } from './screens.service.js';

@Module({
  controllers: [ScreensController],
  providers: [ScreensService],
  exports: [ScreensService],
})
export class ScreensModule {}
