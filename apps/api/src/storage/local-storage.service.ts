import { copyFile, mkdir, readdir, rename, rm, stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { StorageService } from './storage.service.js';

const KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,200}$/;
const STALE_INCOMING_MS = 60 * 60 * 1000;

/** Grava os arquivos em UPLOAD_DIR, servidos estaticamente em /uploads. */
@Injectable()
export class LocalStorageService extends StorageService implements OnModuleInit {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly root: string;
  readonly incomingDir: string;

  constructor(config: ConfigService<Env, true>) {
    super();
    this.root = resolve(config.get('UPLOAD_DIR', { infer: true }));
    // Dentro do UPLOAD_DIR (mesmo volume, rename atômico). Arquivos com "." no
    // início não são servidos (dotfiles: 'deny').
    this.incomingDir = join(this.root, '.incoming');
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.incomingDir, { recursive: true });
    await this.purgeStaleIncoming();
  }

  async save(key: string, sourcePath: string): Promise<void> {
    const target = this.pathFor(key);
    try {
      await rename(sourcePath, target);
    } catch (error) {
      // Volumes diferentes: copia e remove a origem.
      if ((error as NodeJS.ErrnoException).code !== 'EXDEV') throw error;
      await copyFile(sourcePath, target);
      await rm(sourcePath, { force: true });
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }

  publicUrl(key: string): string {
    return `/uploads/${encodeURIComponent(key)}`;
  }

  /** Garante que a chave não escapa do diretório de uploads. */
  private pathFor(key: string): string {
    const path = resolve(this.root, key);
    if (!KEY_PATTERN.test(key) || !path.startsWith(this.root + sep)) {
      throw new Error(`Chave de storage inválida: ${key}`);
    }
    return path;
  }

  /** Remove sobras de uploads interrompidos. */
  private async purgeStaleIncoming(): Promise<void> {
    const now = Date.now();
    for (const name of await readdir(this.incomingDir)) {
      const file = join(this.incomingDir, name);
      const info = await stat(file).catch(() => null);
      if (info && now - info.mtimeMs > STALE_INCOMING_MS) {
        await rm(file, { force: true });
        this.logger.log(`Upload temporário removido: ${name}`);
      }
    }
  }
}
