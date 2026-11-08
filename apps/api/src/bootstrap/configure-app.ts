import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Response } from 'express';
import { createValidationPipe } from '../common/validation.js';
import type { Env } from '../config/env.js';
import { securityHeaders } from './security.js';

export const API_PREFIX = 'api';

/** Configuração HTTP compartilhada entre main.ts e os testes. */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // A Railway fica atrás de um proxy: sem isso, o throttler veria o IP do proxy.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(securityHeaders());

  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(createValidationPipe());

  const uploadDir = resolve(config.get('UPLOAD_DIR', { infer: true }));
  mkdirSync(uploadDir, { recursive: true });
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads',
    index: false, // sem index e sem listagem de diretório
    dotfiles: 'deny',
    redirect: false,
    maxAge: '7d',
    setHeaders: (res: Response) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    },
  });

  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('LoopScreen API')
        .setDescription('API do LoopScreen (digital signage)')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup(`${API_PREFIX}/docs`, app, document);
  }
}
