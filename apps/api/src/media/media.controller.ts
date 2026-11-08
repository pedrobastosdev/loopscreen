import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Env } from '../config/env.js';
import { MediaDto, RenameMediaDto, UploadLimitsDto } from './dto/media.dto.js';
import { ALLOWED_EXTENSIONS, ALLOWED_MEDIA, MAX_FILES_PER_REQUEST } from './media-types.js';
import { MediaService } from './media.service.js';

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
export class MediaController {
  constructor(
    private readonly media: MediaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get()
  @ApiOkResponse({ type: [MediaDto] })
  list(): Promise<MediaDto[]> {
    return this.media.list();
  }

  @Get('limits')
  @ApiOkResponse({ type: UploadLimitsDto })
  limits(): UploadLimitsDto {
    return {
      maxUploadMb: this.config.get('MAX_UPLOAD_MB', { infer: true }),
      maxFilesPerRequest: MAX_FILES_PER_REQUEST,
      mimeTypes: Object.keys(ALLOWED_MEDIA),
      extensions: ALLOWED_EXTENSIONS,
    };
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files', MAX_FILES_PER_REQUEST))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
    },
  })
  @ApiOkResponse({ type: [MediaDto] })
  upload(@UploadedFiles() files: Express.Multer.File[] | undefined): Promise<MediaDto[]> {
    if (!files?.length) throw new BadRequestException('Envie ao menos um arquivo no campo "files"');
    return this.media.upload(files);
  }

  @Patch(':id')
  @ApiOkResponse({ type: MediaDto })
  rename(@Param('id') id: string, @Body() dto: RenameMediaDto): Promise<MediaDto> {
    return this.media.rename(id, dto.name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConflictResponse({ description: 'A mídia está em uso em uma ou mais playlists' })
  remove(@Param('id') id: string): Promise<void> {
    return this.media.remove(id);
  }
}
