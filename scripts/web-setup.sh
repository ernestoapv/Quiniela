#!/usr/bin/env bash
# Setup para sesiones web de Claude Code (SessionStart hook).
# Deja el proyecto listo para compilar/correr: dependencias, engines de Prisma,
# cliente generado y base de datos migrada.
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Confiar en el CA del proxy de salida (si existe).
if [ -f /root/.ccr/ca-bundle.crt ]; then
  export NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
fi

# Variables de entorno de desarrollo si no hay .env.
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Creado .env desde .env.example (ajusta tus credenciales de Google)."
fi

# Dependencias (sin scripts: el postinstall de Prisma falla tras el proxy).
npm install --ignore-scripts

# Engines de Prisma vía curl + rutas exportadas.
# shellcheck disable=SC1091
source scripts/fetch-prisma-engines.sh

# Cliente y base de datos.
npx prisma generate
npx prisma migrate deploy

echo "✅ Entorno listo. Arranca con:  npm run dev"
