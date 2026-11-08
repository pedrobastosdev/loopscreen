import { hashPassword, verifyPassword } from '../auth/password.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Garante que o admin exista com a senha do .env. Idempotente: se a senha
 * mudou no ambiente, o hash é atualizado; senão nada é alterado.
 */
export async function ensureAdmin(
  prisma: PrismaClient,
  email: string,
  password: string,
): Promise<'created' | 'updated' | 'unchanged'> {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalized } });

  if (!existing) {
    await prisma.user.create({
      data: { email: normalized, passwordHash: await hashPassword(password) },
    });
    return 'created';
  }

  if (await verifyPassword(password, existing.passwordHash)) return 'unchanged';

  await prisma.user.update({
    where: { id: existing.id },
    data: { passwordHash: await hashPassword(password) },
  });
  return 'updated';
}
