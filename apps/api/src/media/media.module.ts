import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Env } from '../config/env.js';
import { StorageService } from '../storage/storage.service.js';
import { MAX_FILES_PER_REQUEST } from './media-types.js';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService, StorageService],
      useFactory: (config: ConfigService<Env, true>, storage: StorageService) => ({
        // Grava em disco (nunca em memória) para suportar vídeos grandes.
        storage: diskStorage({
          destination: storage.incomingDir,
          filename: (_req, _file, cb) => cb(null, randomUUID()),
        }),
        limits: {
          fileSize: config.get('MAX_UPLOAD_MB', { infer: true }) * 1024 * 1024,
          files: MAX_FILES_PER_REQUEST,
          fields: 5,
        },
        defParamCharset: 'utf8',
      }),
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
