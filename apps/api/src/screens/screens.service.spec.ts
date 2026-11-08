import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { RealtimeService } from '../realtime/realtime.service.js';
import { isOnline, ScreensService } from './screens.service.js';

const future = () => new Date(Date.now() + 5 * 60_000);
const past = () => new Date(Date.now() - 1000);

function setup(screen: Record<string, unknown> | null) {
  const paired = { ...screen, name: 'TV', pairedAt: new Date(), lastSeenAt: null, playlist: null };
  const prisma = {
    screen: {
      findUnique: vi.fn().mockResolvedValue(screen),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findFirst: vi.fn().mockResolvedValue(paired),
    },
    playlist: { count: vi.fn().mockResolvedValue(1) },
  };
  const realtime = { screenPaired: vi.fn() };
  const service = new ScreensService(
    prisma as unknown as PrismaService,
    realtime as unknown as RealtimeService,
  );
  return { prisma, realtime, service };
}

const dto = { code: '123456', name: 'TV da vitrine', location: 'Loja' };

describe('ScreensService.pair', () => {
  it('pareia com código válido, limpa o código e avisa o player', async () => {
    const { prisma, realtime, service } = setup({
      id: 's1',
      pairedAt: null,
      pairingExpiresAt: future(),
    });

    await service.pair(dto);

    expect(prisma.screen.updateMany).toHaveBeenCalledWith({
      where: { id: 's1', pairedAt: null },
      data: expect.objectContaining({
        name: 'TV da vitrine',
        location: 'Loja',
        pairingCode: null,
        pairingExpiresAt: null,
        pairedAt: expect.any(Date) as Date,
      }) as object,
    });
    expect(realtime.screenPaired).toHaveBeenCalledWith('s1');
  });

  it('recusa código expirado', async () => {
    const { prisma, service } = setup({ id: 's1', pairedAt: null, pairingExpiresAt: past() });
    await expect(service.pair(dto)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.screen.updateMany).not.toHaveBeenCalled();
  });

  it('recusa código inexistente', async () => {
    const { service } = setup(null);
    await expect(service.pair(dto)).rejects.toThrow('Código inválido ou expirado');
  });

  it('recusa tela já pareada', async () => {
    const { service } = setup({ id: 's1', pairedAt: new Date(), pairingExpiresAt: future() });
    await expect(service.pair(dto)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('recusa quando outro pareamento ganhou a corrida', async () => {
    const { prisma, realtime, service } = setup({
      id: 's1',
      pairedAt: null,
      pairingExpiresAt: future(),
    });
    prisma.screen.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.pair(dto)).rejects.toBeInstanceOf(NotFoundException);
    expect(realtime.screenPaired).not.toHaveBeenCalled();
  });

  it('valida a playlist escolhida', async () => {
    const { prisma, service } = setup({ id: 's1', pairedAt: null, pairingExpiresAt: future() });
    prisma.playlist.count.mockResolvedValue(0);
    await expect(service.pair({ ...dto, playlistId: 'nope' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('isOnline', () => {
  it('considera online quem foi visto há menos de 90s', () => {
    const now = Date.now();
    expect(isOnline(new Date(now - 89_000), now)).toBe(true);
    expect(isOnline(new Date(now - 91_000), now)).toBe(false);
    expect(isOnline(null, now)).toBe(false);
  });
});
