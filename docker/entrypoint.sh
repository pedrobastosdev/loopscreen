#!/bin/sh
set -e

UPLOAD_DIR="${UPLOAD_DIR:-/data/uploads}"

# Volumes da Railway são montados como root. Se o container iniciou como root,
# garantimos o diretório de uploads e rebaixamos para o usuário "node".
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$UPLOAD_DIR"
  chown node:node "$UPLOAD_DIR"
  exec setpriv --reuid=node --regid=node --init-groups "$0" "$@"
fi

# setpriv mantém HOME=/root; o cache do fontconfig (sharp) precisa de um diretório gravável.
export HOME=/home/node XDG_CACHE_HOME=/tmp/.cache

echo "Aplicando migrations..."
./node_modules/.bin/prisma migrate deploy

# Garante o usuário admin (idempotente; sincroniza a senha com ADMIN_PASSWORD).
node dist/scripts/seed.js

# Demo opcional: só popula se o banco ainda não tiver playlists.
if [ "$SEED_DEMO" = "true" ]; then
  node dist/scripts/seed-demo.js --if-empty
fi

echo "Iniciando LoopScreen..."
exec node dist/main.js
