import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Screen } from '../generated/prisma/client.js';
import { DevicesService } from './devices.service.js';

export const DEVICE_TOKEN_HEADER = 'x-device-token';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Preenchido pelo DeviceAuthGuard. */
      device?: Screen;
    }
  }
}

/** Autentica o player pelo deviceToken (rotas marcadas com @Public()). */
@Injectable()
export class DeviceAuthGuard implements CanActivate {
  constructor(private readonly devices: DevicesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.header(DEVICE_TOKEN_HEADER);
    if (!token || token.length > 128) throw new UnauthorizedException('Dispositivo não registrado');

    const screen = await this.devices.findByToken(token);
    if (!screen) throw new UnauthorizedException('Dispositivo não registrado');

    req.device = screen;
    return true;
  }
}
