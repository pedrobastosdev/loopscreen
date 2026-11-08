import { Global, Module } from '@nestjs/common';
import { DeviceAuthGuard } from './device-auth.guard.js';
import { DevicesController } from './devices.controller.js';
import { DevicesService } from './devices.service.js';

@Global()
@Module({
  controllers: [DevicesController],
  providers: [DevicesService, DeviceAuthGuard],
  exports: [DevicesService, DeviceAuthGuard],
})
export class DevicesModule {}
