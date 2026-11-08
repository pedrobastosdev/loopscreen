import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Manifest } from '../player/manifest.js';
import {
  CreatePlaylistDto,
  PlaylistDetailDto,
  PlaylistSummaryDto,
  SavePlaylistDto,
} from './dto/playlist.dto.js';
import { PlaylistsService } from './playlists.service.js';

@ApiTags('playlists')
@ApiBearerAuth()
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlists: PlaylistsService) {}

  @Get()
  @ApiOkResponse({ type: [PlaylistSummaryDto] })
  list(): Promise<PlaylistSummaryDto[]> {
    return this.playlists.list();
  }

  @Post()
  @ApiOkResponse({ type: PlaylistDetailDto })
  create(@Body() dto: CreatePlaylistDto): Promise<PlaylistDetailDto> {
    return this.playlists.create(dto.name);
  }

  @Get(':id')
  @ApiOkResponse({ type: PlaylistDetailDto })
  get(@Param('id') id: string): Promise<PlaylistDetailDto> {
    return this.playlists.get(id);
  }

  @Put(':id')
  @ApiOkResponse({ type: PlaylistDetailDto })
  save(@Param('id') id: string, @Body() dto: SavePlaylistDto): Promise<PlaylistDetailDto> {
    return this.playlists.save(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.playlists.remove(id);
  }

  /** Manifest para a pré-visualização no painel (mesmo formato do player). */
  @Get(':id/manifest')
  manifest(@Param('id') id: string): Promise<Manifest> {
    return this.playlists.manifest(id);
  }
}
