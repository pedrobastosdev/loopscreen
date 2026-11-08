import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string({ error: 'DATABASE_URL é obrigatória' })
    .min(1, 'DATABASE_URL é obrigatória'),
  JWT_SECRET: z
    .string({ error: 'JWT_SECRET é obrigatória' })
    .min(32, 'JWT_SECRET é obrigatória e precisa de pelo menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('12h'),
  ADMIN_EMAIL: z.email().default('admin@loopscreen.local'),
  ADMIN_PASSWORD: z
    .string({ error: 'ADMIN_PASSWORD é obrigatória' })
    .min(8, 'ADMIN_PASSWORD é obrigatória (mínimo 8 caracteres)'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(100),
  /** Diretório com o build do front. Por padrão, apps/web/dist. */
  WEB_DIST_DIR: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Valida as variáveis de ambiente na inicialização. Se faltar algo obrigatório,
 * a aplicação não sobe e a mensagem lista todos os problemas de uma vez.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${issues}`);
  }
  return result.data;
}
