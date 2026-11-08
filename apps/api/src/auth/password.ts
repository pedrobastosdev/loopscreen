import bcrypt from 'bcryptjs';

const ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Hash fixo usado quando o email não existe, para não vazar isso pelo tempo de resposta. */
export const DUMMY_HASH = '$2b$12$wG4nERE/SB6X6Kb5S3u0VOLJcn5GVl4Aktx2778c3zK3HmiLLoxFi';
