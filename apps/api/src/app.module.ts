import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { PayloadTooLargeFilter } from './common/filters/payload-too-large.filter.js';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';
import { validateEnv, type Env } from './config/env.js';
import { MediaModule } from './media/media.module.js';
import { StorageModule } from './storage/storage.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { resolveWebDistDir, webStaticOptions } from './web/web-static.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 300 }],
      errorMessage: 'Muitas requisições. Aguarde um instante e tente novamente.',
    }),
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        webStaticOptions(resolveWebDistDir(config.get('WEB_DIST_DIR', { infer: true }))),
    }),
    PrismaModule,
    AuthModule,
    StorageModule,
    MediaModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    { provide: APP_FILTER, useClass: PayloadTooLargeFilter },
  ],
})
export class AppModule {}
