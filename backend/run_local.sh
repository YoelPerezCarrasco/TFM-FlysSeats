#!/bin/bash
# Script para ejecutar el backend localmente sin Azure

set -e

if [ -f .env ]; then
	set -a
	source .env
	set +a
fi

echo "🚀 Iniciando Backend Local de FlysSeats"
echo ""

# Exportar variables de entorno locales
export LOCAL_MODE="${LOCAL_MODE:-true}"
export DB_MODE="${DB_MODE:-mongodb}"
export PORT="${PORT:-8000}"
export MONGO_URI="${MONGO_URI:-mongodb://localhost:27017}"
export MONGO_DATABASE="${MONGO_DATABASE:-sitfly}"
export REDIS_ENABLED="${REDIS_ENABLED:-false}"
export REDIS_HOST="${REDIS_HOST:-localhost}"
export REDIS_PORT="${REDIS_PORT:-6379}"
export REDIS_SSL="${REDIS_SSL:-false}"

echo "✅ Variables de entorno configuradas"
echo ""
echo "📡 Backend corriendo en: http://localhost:$PORT"
echo "🔗 Frontend debe apuntar a: http://localhost:$PORT/api"
echo ""
echo "Endpoints disponibles:"
echo "  - GET  /api/health"
echo "  - POST /api/auth/register"
echo "  - POST /api/auth/login"
echo "  - GET  /api/flights/search"
echo "  - POST /api/bookings"
echo "  - GET  /api/bookings/<user_id>"
echo ""
echo "Presiona Ctrl+C para detener"
echo ""

# Iniciar Flask
python3 app.py
