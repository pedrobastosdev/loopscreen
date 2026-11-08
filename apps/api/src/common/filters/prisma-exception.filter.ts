import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

const STATUS_BY_CODE: Record<string, { status: HttpStatus; message: string }> = {
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Registro não encontrado' },
  P2002: { status: HttpStatus.CONFLICT, message: 'Registro duplicado' },
  P2003: { status: HttpStatus.CONFLICT, message: 'Registro referenciado por outro recurso' },
};

/**
 * Converte erros conhecidos do Prisma no mesmo formato das HttpException do Nest,
 * para o front tratar todos os erros de forma igual: { statusCode, message, error }.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const mapped = STATUS_BY_CODE[exception.code];

    if (!mapped) {
      this.logger.error(exception.message, exception.stack);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro interno',
        error: 'Internal Server Error',
      });
      return;
    }

    res.status(mapped.status).json({
      statusCode: mapped.status,
      message: mapped.message,
      error: HttpStatus[mapped.status],
    });
  }
}
