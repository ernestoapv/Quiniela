#!/usr/bin/env bash
# Descarga los binarios (engines) de Prisma con curl.
#
# En el entorno web de Claude el descargador interno de Prisma falla (el proxy
# corta su conexión), pero curl sí funciona. Este script baja los engines a
# .prisma-engines/ y exporta las rutas para que Prisma los use sin descargar.
#
# Uso:  source scripts/fetch-prisma-engines.sh   (para exportar las vars)
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TARGET="${PRISMA_ENGINE_TARGET:-debian-openssl-3.0.x}"
DEST="$ROOT/.prisma-engines"
mkdir -p "$DEST"

HASH="$(node -e "console.log(require('@prisma/engines-version').enginesVersion)" 2>/dev/null)"
if [ -z "$HASH" ]; then
  echo "No se pudo leer enginesVersion. ¿Corriste 'npm install' primero?" >&2
  exit 1
fi

BASE="https://binaries.prisma.sh/all_commits/$HASH/$TARGET"
QE="$DEST/libquery_engine-$TARGET.so.node"
SE="$DEST/schema-engine-$TARGET"

if [ ! -f "$QE" ]; then
  echo "Descargando query engine ($TARGET)…"
  curl -fsSL -m 180 -o "$QE.gz" "$BASE/libquery_engine.so.node.gz"
  gunzip -f "$QE.gz"
fi

if [ ! -f "$SE" ]; then
  echo "Descargando schema engine ($TARGET)…"
  curl -fsSL -m 180 -o "$SE.gz" "$BASE/schema-engine.gz"
  gunzip -f "$SE.gz"
  chmod +x "$SE"
fi

export PRISMA_QUERY_ENGINE_LIBRARY="$QE"
export PRISMA_SCHEMA_ENGINE_BINARY="$SE"
echo "Engines listos:"
echo "  PRISMA_QUERY_ENGINE_LIBRARY=$PRISMA_QUERY_ENGINE_LIBRARY"
echo "  PRISMA_SCHEMA_ENGINE_BINARY=$PRISMA_SCHEMA_ENGINE_BINARY"
