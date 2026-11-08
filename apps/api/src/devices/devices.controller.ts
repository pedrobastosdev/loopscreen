import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator.js';
import { DevicesService } from './devices.service.js';

class RegisterDeviceResponseDto {
  @ApiProperty({ description: 'Segredo do dispositivo. Guarde-o: não é exibido de novo.' })
  deviceToken: string;
  @ApiProperty({ example: '482913' }) pairingCode: string;
  @ApiProperty() expiresAt: Date;
}

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({ type: RegisterDeviceResponseDto })
  register(): Promise<RegisterDeviceResponseDto> {
    return this.devices.register();
  }
}
