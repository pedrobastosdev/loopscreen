import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { Env } from '../../config/env.js';

/** Mensagem clara (com o limite configurado) quando o multer recusa um arquivo grande. */
@Catch(PayloadTooLargeException)
export class PayloadTooLargeFilter implements ExceptionFilter {
  constructor(private readonly config: ConfigService<Env, true>) {}

  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    const max = this.config.get('MAX_UPLOAD_MB', { infer: true });
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.PAYLOAD_TOO_LARGE)
      .json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: `Arquivo maior que o limite de ${max} MB`,
        error: 'Payload Too Large',
      });
  }
}
