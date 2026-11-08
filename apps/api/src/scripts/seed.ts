import 'dotenv/config';
import { validateEnv } from '../config/env.js';
import { createPrismaClient } from '../prisma/create-prisma-client.js';
import { ensureAdmin } from './ensure-admin.js';

const env = validateEnv(process.env);
const prisma = createPrismaClient(env.DATABASE_URL);

try {
  const result = await ensureAdmin(prisma, env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
  console.log(`Admin ${env.ADMIN_EMAIL}: ${result}`);
} finally {
  await prisma.$disconnect();
}
