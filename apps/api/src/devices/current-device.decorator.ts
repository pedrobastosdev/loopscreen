import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { Screen } from '../generated/prisma/client.js';

export const CurrentDevice = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Screen => {
    const device = ctx.switchToHttp().getRequest<Request>().device;
    if (!device) throw new UnauthorizedException('Dispositivo não registrado');
    return device;
  },
);
