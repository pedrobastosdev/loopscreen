import { validateEnv } from './env.js';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32),
  ADMIN_PASSWORD: 'senha-forte',
};

describe('validateEnv', () => {
  it('aceita a configuração mínima e aplica os padrões', () => {
    const env = validateEnv(valid);
    expect(env.PORT).toBe(3000);
    expect(env.MAX_UPLOAD_MB).toBe(100);
    expect(env.UPLOAD_DIR).toBe('./uploads');
  });

  it.each(['DATABASE_URL', 'JWT_SECRET', 'ADMIN_PASSWORD'] as const)(
    'falha quando %s está ausente',
    (key) => {
      const config: Record<string, string> = { ...valid };
      delete config[key];
      expect(() => validateEnv(config)).toThrow(key);
    },
  );

  it('recusa JWT_SECRET curto', () => {
    expect(() => validateEnv({ ...valid, JWT_SECRET: 'curto' })).toThrow('JWT_SECRET');
  });

  it('converte números vindos como string', () => {
    expect(validateEnv({ ...valid, PORT: '8080', MAX_UPLOAD_MB: '20' })).toMatchObject({
      PORT: 8080,
      MAX_UPLOAD_MB: 20,
    });
  });
});
