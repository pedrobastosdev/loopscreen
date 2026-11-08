# LoopScreen

Digital signage que roda no navegador: cadastre imagens e vídeos, monte playlists e
pareie qualquer TV, monitor ou mini-PC com um código de 6 dígitos. A tela toca em loop,
recebe atualizações em tempo real e continua tocando mesmo sem internet.

> **Demo:** _https://SEU-APP.up.railway.app_ (login de demonstração em `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

<!-- Substitua pelos arquivos reais em docs/ -->

| Painel                               | Player                             |
| ------------------------------------ | ---------------------------------- |
| ![Painel de telas](docs/screens.png) | ![Player em loop](docs/player.gif) |

## Funcionalidades

- **Mídias** — upload de JPG, PNG, WebP, MP4 e WebM (validação por _magic bytes_), com miniaturas.
- **Playlists** — editor com arrastar e soltar, duração por item e pré-visualização em tela cheia.
- **Telas** — pareamento por código (expira em 10 min), status online/offline ao vivo e troca de playlist.
- **Player** (`/player`) — dois slots com pré-carregamento e transição suave, _watchdog_ para vídeos travados.
- **Tempo real** — Socket.IO: a tela atualiza ~100 ms depois de salvar a playlist; _polling_ como fallback.
- **Offline-first** — Service Worker guarda o app e as mídias; sem rede, o player segue com o último manifest.

## Arquitetura

```mermaid
flowchart LR
  subgraph Navegador
    A[Painel admin<br/>React + TanStack Query]
    P[Player /player<br/>Service Worker + cache]
  end
  subgraph "Serviço único (Railway)"
    N[NestJS<br/>/api · /socket.io · /uploads]
    S[Build estático do React]
  end
  DB[(PostgreSQL<br/>Prisma)]
  V[(Volume /data<br/>uploads)]

  A -- "REST /api (JWT)" --> N
  A <-- "socket.io (admins)" --> N
  P -- "GET /api/player/manifest<br/>x-device-token" --> N
  P <-- "socket.io (screen:id)" --> N
  N --> DB
  N --> V
  N -. serve .-> S
```

Monorepo pnpm:

| Pacote     | Stack                                                                               |
| ---------- | ----------------------------------------------------------------------------------- |
| `apps/api` | NestJS 12 (ESM), Prisma 7 + PostgreSQL, Socket.IO, class-validator, Swagger, Vitest |
| `apps/web` | React 19, Vite 8, Tailwind 4, shadcn/ui, TanStack Query, React Router, dnd-kit      |

Em produção há **um único serviço**: o Nest serve o build do React, todas as rotas da API
ficam em `/api` e o Socket.IO usa a mesma origem (sem CORS).

## Rodando localmente

Pré-requisitos: Node 24+, pnpm (via `corepack enable`) e Docker/Podman.

```bash
pnpm install
cp apps/api/.env.example apps/api/.env      # ajuste JWT_SECRET e ADMIN_PASSWORD
docker compose up -d                          # PostgreSQL em localhost:5432
pnpm db:migrate                               # aplica as migrations
pnpm seed:demo                                # admin + banners, 2 playlists e 2 telas
pnpm dev                                      # API :3000 e web :5173 (com proxy)
```

Abra http://localhost:5173 e entre com `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Para parear
uma tela, abra http://localhost:5173/player em outra janela e digite o código em **Telas → Parear**.

Outros comandos: `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm seed` (só o admin).
A documentação da API (Swagger) fica em http://localhost:3000/api/docs fora de produção.

### Testando a imagem Docker

```bash
docker build -t loopscreen .
docker run --rm -p 3000:3000 --add-host=host.docker.internal:host-gateway \
  -e DATABASE_URL="postgresql://loopscreen:loopscreen@host.docker.internal:5432/loopscreen" \
  -e JWT_SECRET="$(openssl rand -base64 48)" -e ADMIN_PASSWORD=troque-esta-senha \
  -e SEED_DEMO=true -v loopscreen-data:/data loopscreen
```

O entrypoint aplica as migrations (`prisma migrate deploy`), garante o admin e, com
`SEED_DEMO=true`, cria a demo **apenas se ainda não houver playlists**.

## Deploy na Railway

1. **New Project → Deploy from GitHub repo** e escolha este repositório. O `railway.json`
   já define o build pelo `Dockerfile` e o healthcheck em `/api/health`.
2. **+ New → Database → PostgreSQL** no mesmo projeto.
3. No serviço do app, **Settings → Volumes → New Volume** montado em `/data`.
4. Em **Variables**, configure:

   | Variável         | Valor                                                       |
   | ---------------- | ----------------------------------------------------------- |
   | `DATABASE_URL`   | `${{Postgres.DATABASE_URL}}`                                |
   | `JWT_SECRET`     | resultado de `openssl rand -base64 48` (mín. 32 caracteres) |
   | `ADMIN_EMAIL`    | e-mail do admin                                             |
   | `ADMIN_PASSWORD` | senha forte (mín. 8 caracteres)                             |
   | `UPLOAD_DIR`     | `/data/uploads`                                             |
   | `NODE_ENV`       | `production` (já é o padrão da imagem)                      |
   | `MAX_UPLOAD_MB`  | opcional, padrão `100`                                      |
   | `SEED_DEMO`      | `true` para popular a demo no primeiro deploy               |
   | `PORT`           | não defina — a Railway injeta                               |

5. **Settings → Networking → Generate Domain** para obter a URL pública (HTTPS).
6. Acompanhe o deploy nos logs: `Aplicando migrations...`, `Seed de demonstração`, `Iniciando LoopScreen...`.
7. Abra a URL, faça login e pareie uma tela em `https://SEU-APP.up.railway.app/player`.

Para recriar a demo manualmente depois: `railway ssh` e `node dist/scripts/seed-demo.js`
(sem `--if-empty`, restaura o conteúdo das playlists de exemplo). A aplicação não sobe se
faltar `DATABASE_URL`, `JWT_SECRET` ou `ADMIN_PASSWORD` — a mensagem de erro lista o que falta.

## Player em modo quiosque

Em um mini-PC/Raspberry Pi ligado à TV, abra o player em tela cheia:

```bash
chromium --kiosk --noerrdialogs --disable-infobars --disable-session-crashed-bubble \
  --autoplay-policy=no-user-gesture-required https://SEU-HOST/player
```

- O pareamento fica salvo no navegador: depois de parear uma vez, a tela volta sozinha após reiniciar.
- **O Service Worker (cache offline) só funciona em HTTPS ou `localhost`.** Em `http://IP-DA-REDE`
  o player toca normalmente, mas sem cache offline. Para testes em LAN, use
  `--unsafely-treat-insecure-origin-as-secure=http://IP-DA-REDE:3000 --user-data-dir=/tmp/kiosk`.

## Segurança e próximos passos

Já implementado:

- `deviceToken` das telas armazenado só como hash SHA-256; código de pareamento expira em 10 min
  e telas não pareadas são removidas após 1 h.
- No Socket.IO, o `screenId` vem sempre do token validado no handshake, nunca do payload;
  conexões sem token válido são desconectadas.
- Uploads validados por _magic bytes_ (SVG recusado); `/uploads` servido com `nosniff`,
  CSP `sandbox` e sem listagem de diretório.
- Helmet com CSP ativa (liberando `media`/`blob`/`worker`/`ws`), rate limit no login,
  `trust proxy` para funcionar atrás do proxy da Railway e Swagger desligado em produção.
- Variáveis de ambiente validadas na inicialização.

Próximos passos recomendados:

- **URLs assinadas para mídia** — mover os uploads para S3/Cloudflare R2 e servir com URLs
  assinadas de curta duração, em vez de arquivos públicos em `/uploads`.
- **JWT em cookie `httpOnly`** (`SameSite=Strict` + proteção CSRF), em vez de `localStorage`,
  reduzindo o impacto de um eventual XSS.
- Fora do escopo do MVP: agendamento por horário/dia, multi-tenant (várias empresas/usuários),
  relatórios de exibição (_proof of play_), armazenamento em nuvem e áudio.
