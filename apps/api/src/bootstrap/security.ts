import helmet from 'helmet';
import type { RequestHandler } from 'express';

/**
 * Helmet com uma CSP explícita. A CSP nunca é desligada: só liberamos o que
 * o app realmente usa (mídia/blob para o player, worker para o Service
 * Worker e WebSocket na mesma origem para o Socket.IO).
 */
export function securityHeaders(): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        scriptSrc: ["'self'"],
        // shadcn/sonner aplicam estilos inline em runtime
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'blob:'],
        fontSrc: ["'self'", 'data:'],
        // 'self' cobre ws:/wss: na mesma origem (CSP3); listamos explicitamente
        // para navegadores mais antigos de players (ex.: Chromium em Raspberry Pi).
        connectSrc: ["'self'", 'ws:', 'wss:'],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      },
    },
    // Players em rede local costumam acessar via http://IP, então não forçamos upgrade.
    strictTransportSecurity: process.env['NODE_ENV'] === 'production',
  });
}
