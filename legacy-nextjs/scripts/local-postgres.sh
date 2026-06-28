#!/usr/bin/env bash
# Levanta un Postgres local efímero para desarrollo (no para producción).
# En producción usa Neon/Vercel Postgres (ver README).
#
# Idempotente: si ya está corriendo, no hace nada. Imprime la DATABASE_URL.
#
# Uso:  bash scripts/local-postgres.sh
set -e

PORT="${LOCAL_PG_PORT:-5433}"
PGDATA="${LOCAL_PG_DATA:-/tmp/quiniela-pgdata}"
SOCK="/tmp/quiniela-pgsock"
DBNAME="quiniela"
PGBIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)"

if [ -z "$PGBIN" ]; then
  echo "No se encontró PostgreSQL instalado." >&2
  exit 1
fi

# Postgres no corre como root: usamos un usuario sin privilegios.
RUNUSER=""
if [ "$(id -u)" = "0" ]; then
  RUNUSER="pguser"
  id "$RUNUSER" >/dev/null 2>&1 || useradd -m "$RUNUSER"
fi
run() { if [ -n "$RUNUSER" ]; then su "$RUNUSER" -c "$1"; else bash -c "$1"; fi; }

mkdir -p "$SOCK"; chmod 777 "$SOCK"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  mkdir -p "$PGDATA"
  [ -n "$RUNUSER" ] && chown -R "$RUNUSER:$RUNUSER" "$PGDATA"
  run "$PGBIN/initdb -D $PGDATA -U postgres --auth=trust" >/tmp/quiniela-pg-init.log 2>&1
fi

if ! "$PGBIN/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
  run "$PGBIN/pg_ctl -D $PGDATA -o '-p $PORT -k $SOCK -c listen_addresses=127.0.0.1' -l /tmp/quiniela-pg.log start" >/dev/null 2>&1 || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    "$PGBIN/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1 && break
    sleep 1
  done
fi

run "$PGBIN/psql -h 127.0.0.1 -p $PORT -U postgres -tc \"SELECT 1 FROM pg_database WHERE datname='$DBNAME'\" | grep -q 1 || $PGBIN/psql -h 127.0.0.1 -p $PORT -U postgres -c 'CREATE DATABASE $DBNAME'" >/dev/null 2>&1 || true

echo "Postgres local listo en 127.0.0.1:$PORT (db: $DBNAME)."
echo "DATABASE_URL=\"postgresql://postgres@127.0.0.1:$PORT/$DBNAME?schema=public\""
