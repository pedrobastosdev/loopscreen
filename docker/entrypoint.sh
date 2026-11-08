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

echo "Aplicando migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Iniciando LoopScreen..."
exec node dist/main.js
