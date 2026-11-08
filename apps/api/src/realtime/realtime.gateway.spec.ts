import type { AuthService } from '../auth/auth.service.js';
import type { DevicesService } from '../devices/devices.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { RealtimeGateway } from './realtime.gateway.js';
import type { RealtimeService } from './realtime.service.js';

type Gateway = RealtimeGateway;
type ConnectArg = Parameters<Gateway['handleConnection']>[0];

function fakeSocket(auth: Record<string, unknown>) {
  return {
    handshake: { auth },
    data: {} as { identity?: { kind: string; screenId?: string } },
    join: vi.fn(() => Promise.resolve()),
    disconnect: vi.fn(),
  };
}

function setup() {
  const devices = {
    findByToken: vi.fn((token: string) =>
      Promise.resolve(token === 'token-da-tela-1' ? { id: 'screen-1' } : null),
    ),
  };
  const auth = {
    verifyToken: vi.fn((token: string) =>
      Promise.resolve(token === 'jwt-valido' ? { id: 'u1', email: 'a@b.c' } : null),
    ),
  };
  const prisma = {
    screen: { update: vi.fn(() => Promise.resolve({ pairedAt: new Date() })) },
  };
  const realtime = { attach: vi.fn(), screenStatus: vi.fn() };
  const gateway = new RealtimeGateway(
    realtime as unknown as RealtimeService,
    devices as unknown as DevicesService,
    auth as unknown as AuthService,
    prisma as unknown as PrismaService,
  );
  return { gateway, prisma, realtime };
}

describe('RealtimeGateway', () => {
  it.each([
    ['sem credenciais', {}],
    ['deviceToken inválido', { deviceToken: 'inventado' }],
    ['JWT inválido', { token: 'jwt-falso' }],
    ['deviceToken que não é string', { deviceToken: { $ne: null } }],
  ])('desconecta socket %s', async (_label, auth) => {
    const { gateway } = setup();
    const socket = fakeSocket(auth);

    await gateway.handleConnection(socket as unknown as ConnectArg);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('coloca o player na room da tela do token e marca como visto', async () => {
    const { gateway, prisma, realtime } = setup();
    const socket = fakeSocket({ deviceToken: 'token-da-tela-1' });

    await gateway.handleConnection(socket as unknown as ConnectArg);

    expect(socket.join).toHaveBeenCalledWith('screen:screen-1');
    expect(socket.data.identity).toEqual({ kind: 'device', screenId: 'screen-1' });
    expect(prisma.screen.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'screen-1' } }),
    );
    expect(realtime.screenStatus).toHaveBeenCalledWith(
      expect.objectContaining({ screenId: 'screen-1', online: true }),
    );
  });

  it('coloca o painel na room de admins', async () => {
    const { gateway } = setup();
    const socket = fakeSocket({ token: 'jwt-valido' });

    await gateway.handleConnection(socket as unknown as ConnectArg);

    expect(socket.join).toHaveBeenCalledWith('admins');
  });

  it('heartbeat usa o screenId do handshake, ignorando o payload', async () => {
    const { gateway, prisma } = setup();
    const socket = fakeSocket({ deviceToken: 'token-da-tela-1' });
    await gateway.handleConnection(socket as unknown as ConnectArg);
    prisma.screen.update.mockClear();

    // Um cliente malicioso tenta se passar por outra tela.
    const heartbeat = gateway.heartbeat.bind(gateway) as (
      client: unknown,
      payload: unknown,
    ) => Promise<{ ok: boolean }>;
    const result = await heartbeat(socket, { screenId: 'outra-tela' });

    expect(result).toEqual({ ok: true });
    expect(prisma.screen.update).toHaveBeenCalledTimes(1);
    expect(prisma.screen.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'screen-1' } }),
    );
  });

  it('heartbeat de socket do painel é ignorado', async () => {
    const { gateway, prisma } = setup();
    const socket = fakeSocket({ token: 'jwt-valido' });
    await gateway.handleConnection(socket as unknown as ConnectArg);

    await expect(gateway.heartbeat(socket as unknown as ConnectArg)).resolves.toEqual({
      ok: false,
    });
    expect(prisma.screen.update).not.toHaveBeenCalled();
  });
});
