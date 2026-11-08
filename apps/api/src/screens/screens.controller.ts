import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PairScreenDto, ScreenDto, UpdateScreenDto } from './dto/screen.dto.js';
import { ScreensService } from './screens.service.js';

@ApiTags('screens')
@ApiBearerAuth()
@Controller('screens')
export class ScreensController {
  constructor(private readonly screens: ScreensService) {}

  @Get()
  @ApiOkResponse({ type: [ScreenDto] })
  list(): Promise<ScreenDto[]> {
    return this.screens.list();
  }

  @Post('pair')
  // Limita tentativas de adivinhar códigos.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOkResponse({ type: ScreenDto })
  @ApiNotFoundResponse({ description: 'Código inválido ou expirado' })
  pair(@Body() dto: PairScreenDto): Promise<ScreenDto> {
    return this.screens.pair(dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ScreenDto })
  update(@Param('id') id: string, @Body() dto: UpdateScreenDto): Promise<ScreenDto> {
    return this.screens.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.screens.remove(id);
  }
}
