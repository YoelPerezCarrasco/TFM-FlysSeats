#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/flyseats-frontend"

if [[ -f "$BACKEND_DIR/.env" ]]; then
  set -a
  source "$BACKEND_DIR/.env"
  set +a
fi

BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-4200}"
LOCAL_MODE="${LOCAL_MODE:-true}"
DB_MODE="${DB_MODE:-mongodb}"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27017}"
MONGO_DATABASE="${MONGO_DATABASE:-sitfly}"
MONGO_EMULATOR="${MONGO_EMULATOR:-true}"
AUTO_START_DOCKER_SERVICES="${AUTO_START_DOCKER_SERVICES:-false}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ python3 no está instalado"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "❌ npm no está instalado"
  exit 1
fi

if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$BACKEND_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "❌ El puerto $BACKEND_PORT ya está en uso."
  echo "   Cierra el proceso que lo usa o lanza con BACKEND_PORT=8010 make dev"
  exit 1
fi

if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "❌ El puerto $FRONTEND_PORT ya está en uso."
  echo "   Cierra el proceso que lo usa o lanza con FRONTEND_PORT=4300 make dev"
  exit 1
fi

mongo_reachable() {
  python3 - "$MONGO_URI" <<'PY'
import socket
import sys
from urllib.parse import urlparse

uri = sys.argv[1]
parsed = urlparse(uri)
host = parsed.hostname or 'localhost'
port = parsed.port or 27017

try:
    with socket.create_connection((host, port), timeout=1.2):
        print('ok')
except Exception:
    sys.exit(1)
PY
}

if [[ "$DB_MODE" == "mongodb" ]] && [[ "$AUTO_START_DOCKER_SERVICES" == "true" ]] && command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "🍃 Iniciando MongoDB y Redis en Docker..."
  if ! (cd "$ROOT_DIR" && docker compose up -d mongo redis >/dev/null); then
    echo "⚠️  No se pudieron iniciar contenedores Mongo/Redis (red o Docker registry)."
    echo "   Fallback automático a local-json para no bloquear el entorno local."
    DB_MODE="local-json"
  fi
fi

if [[ "$DB_MODE" == "mongodb" ]]; then
  if ! mongo_reachable >/dev/null 2>&1; then
    echo "⚠️  MongoDB no está accesible en $MONGO_URI"
    if [[ "$MONGO_EMULATOR" == "true" ]]; then
      echo "   Se usará emulador local Mongita manteniendo DB_MODE=mongodb."
    else
      echo "   Fallback automático a local-json para continuar sin bloqueo."
      DB_MODE="local-json"
    fi
  fi
fi

PIDS=()

cleanup() {
  echo ""
  echo "🛑 Parando servicios..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
  wait || true
}

trap cleanup EXIT INT TERM

echo "🚀 Iniciando backend local en puerto $BACKEND_PORT..."
(
  cd "$BACKEND_DIR"
  LOCAL_MODE="$LOCAL_MODE" DB_MODE="$DB_MODE" MONGO_URI="$MONGO_URI" MONGO_DATABASE="$MONGO_DATABASE" MONGO_EMULATOR="$MONGO_EMULATOR" PORT="$BACKEND_PORT" python3 app.py
) &
PIDS+=("$!")

sleep 2

echo "🌐 Iniciando frontend Angular..."
(
  cd "$FRONTEND_DIR"
  npm start -- --port "$FRONTEND_PORT"
) &
PIDS+=("$!")

echo ""
echo "✅ Entorno local levantado"
echo "   - DB Mode:  $DB_MODE"
echo "   - Backend:  http://localhost:$BACKEND_PORT"
echo "   - Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "Pulsa Ctrl+C para detener ambos servicios."

wait -n "${PIDS[@]}"
