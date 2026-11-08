import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiConflictResponse, ApiHeader, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator.js';
import { CurrentDevice } from '../devices/current-device.decorator.js';
import { DEVICE_TOKEN_HEADER, DeviceAuthGuard } from '../devices/device-auth.guard.js';
import type { Screen } from '../generated/prisma/client.js';
import { PlayerService, type PlayerManifest, type PlayerStatus } from './player.service.js';

/** Rotas do player: sem JWT, autenticadas pelo deviceToken. */
@ApiTags('player')
@ApiHeader({ name: DEVICE_TOKEN_HEADER, required: true })
@Public()
@SkipThrottle()
@UseGuards(DeviceAuthGuard)
@Controller('player')
export class PlayerController {
  constructor(private readonly player: PlayerService) {}

  @Get('status')
  status(@CurrentDevice() device: Screen): Promise<PlayerStatus> {
    return this.player.status(device);
  }

  @Get('manifest')
  @ApiConflictResponse({ description: 'Tela ainda não pareada' })
  manifest(@CurrentDevice() device: Screen): Promise<PlayerManifest> {
    return this.player.manifest(device);
  }
}
