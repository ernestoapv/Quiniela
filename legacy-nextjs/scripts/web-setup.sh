#!/usr/bin/env bash
# Setup para sesiones web de Claude Code (SessionStart hook).
# Deja el proyecto listo para compilar/correr: dependencias, engines de Prisma,
# cliente generado y base de datos migrada.
#
# - En producción/Vercel la base es Postgres (Neon). En local, si la DATABASE_URL
#   apunta a 127.0.0.1, se levanta un Postgres local efímero automáticamente.
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
  echo "Creado .env desde .env.example (ajusta tus credenciales)."
fi

# Dependencias (sin scripts: el postinstall de Prisma falla tras el proxy).
npm install --ignore-scripts

# Engines de Prisma vía curl + rutas exportadas.
# shellcheck disable=SC1091
source scripts/fetch-prisma-engines.sh

# Cliente Prisma (siempre, para que compile el proyecto).
npx prisma generate

# Cargar DATABASE_URL desde .env.
DB_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"')"

# Si la base es local, levantar Postgres local efímero.
case "$DB_URL" in
  *127.0.0.1*|*localhost*) bash scripts/local-postgres.sh || true ;;
esac

# Migrar solo si la base responde; si no, avisar sin romper la sesión.
if [ -n "$DB_URL" ] && npx --no-install prisma migrate deploy >/tmp/quiniela-migrate.log 2>&1; then
  echo "Migraciones aplicadas."
else
  echo "⚠️  No se pudo migrar la base (¿DATABASE_URL configurada y accesible?)."
  echo "    Configura DATABASE_URL (Neon/Postgres) en .env y corre: npx prisma migrate deploy"
fi

echo "✅ Entorno listo. Arranca con:  npm run dev"
