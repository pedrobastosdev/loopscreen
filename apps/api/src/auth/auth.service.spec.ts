import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import { hashPassword } from './password.js';

describe('AuthService', () => {
  const jwt = new JwtService({ secret: 'x'.repeat(32) });
  let findUnique: ReturnType<typeof vi.fn>;
  let service: AuthService;

  beforeAll(async () => {
    const passwordHash = await hashPassword('senha-correta');
    findUnique = vi.fn(({ where }: { where: { email?: string; id?: string } }) =>
      where.email === 'admin@x.com' || where.id === 'u1'
        ? { id: 'u1', email: 'admin@x.com', passwordHash }
        : null,
    );
    service = new AuthService({ user: { findUnique } } as unknown as PrismaService, jwt);
  });

  it('retorna um JWT válido com credenciais corretas', async () => {
    const result = await service.login('admin@x.com', 'senha-correta');
    expect(result.user).toEqual({ id: 'u1', email: 'admin@x.com' });
    await expect(jwt.verifyAsync(result.accessToken)).resolves.toMatchObject({ sub: 'u1' });
  });

  it('recusa senha errada', async () => {
    await expect(service.login('admin@x.com', 'errada')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('recusa email inexistente com a mesma mensagem', async () => {
    await expect(service.login('ninguem@x.com', 'qualquer')).rejects.toThrow(
      'Email ou senha inválidos',
    );
  });

  it('verifyToken devolve null para token inválido', async () => {
    await expect(service.verifyToken('lixo')).resolves.toBeNull();
  });
});
