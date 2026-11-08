import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { hashDeviceToken } from './device-token.js';
import { DevicesService } from './devices.service.js';

function setup() {
  const prisma = {
    screen: {
      create: vi.fn((args: { data: Record<string, unknown> }) => ({ id: 's1', ...args.data })),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      deleteMany: vi.fn((_args: { where: unknown }) => Promise.resolve({ count: 2 })),
    },
  };
  return { prisma, service: new DevicesService(prisma as unknown as PrismaService) };
}

const collision = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint', {
    code: 'P2002',
    clientVersion: 'test',
  });

describe('DevicesService.register', () => {
  it('guarda só o hash do token e devolve o token em texto puro', async () => {
    const { prisma, service } = setup();

    const result = await service.register();
    const data = prisma.screen.create.mock.calls[0]?.[0].data;

    expect(result.deviceToken).toHaveLength(43);
    expect(data?.['deviceTokenHash']).toBe(hashDeviceToken(result.deviceToken));
    expect(data?.['deviceTokenHash']).not.toBe(result.deviceToken);
    expect(result.pairingCode).toMatch(/^\d{6}$/);
  });

  it('código expira em 10 minutos', async () => {
    const { service } = setup();
    const { expiresAt } = await service.register();
    const minutes = (expiresAt.getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(9.9);
    expect(minutes).toBeLessThanOrEqual(10);
  });

  it('tenta outro código quando há colisão com um código ativo', async () => {
    const { prisma, service } = setup();
    prisma.screen.create.mockRejectedValueOnce(collision());

    await service.register();

    expect(prisma.screen.create).toHaveBeenCalledTimes(2);
  });

  it('libera códigos expirados iguais antes de usar o número', async () => {
    const { prisma, service } = setup();
    await service.register();
    expect(prisma.screen.updateMany).toHaveBeenCalledWith({
      where: {
        pairingCode: expect.any(String) as string,
        pairingExpiresAt: { lt: expect.any(Date) as Date },
      },
      data: { pairingCode: null, pairingExpiresAt: null },
    });
  });
});

describe('DevicesService.purgeUnpaired', () => {
  it('remove só telas não pareadas criadas há mais de 1 hora', async () => {
    const { prisma, service } = setup();
    await service.purgeUnpaired();
    const where = prisma.screen.deleteMany.mock.calls[0]?.[0].where as {
      pairedAt: null;
      createdAt: { lt: Date };
    };
    expect(where.pairedAt).toBeNull();
    const ageMin = (Date.now() - where.createdAt.lt.getTime()) / 60_000;
    expect(Math.round(ageMin)).toBe(60);
  });
});
