import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ServeStaticModuleOptions } from '@nestjs/serve-static';
import type { Response } from 'express';

/** Rotas que nunca devem cair no fallback do SPA. */
export const NON_SPA_PATHS = ['/api/{*path}', '/uploads/{*path}', '/socket.io/{*path}'];

export function resolveWebDistDir(configured?: string): string {
  return configured
    ? resolve(configured)
    : resolve(import.meta.dirname, '..', '..', '..', 'web', 'dist');
}

/**
 * Serve o build do React com fallback para index.html. Em desenvolvimento o
 * front roda no Vite, então se o build não existir nada é registrado.
 */
export function webStaticOptions(distDir: string): ServeStaticModuleOptions[] {
  if (!existsSync(join(distDir, 'index.html'))) return [];

  return [
    {
      rootPath: distDir,
      exclude: NON_SPA_PATHS,
      serveStaticOptions: {
        index: false,
        setHeaders: (res: Response, filePath: string) => {
          if (filePath.includes(`${join('dist', 'assets')}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      },
    },
  ];
}
