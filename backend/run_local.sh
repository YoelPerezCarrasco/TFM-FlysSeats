#!/bin/bash
# Script para ejecutar el backend localmente

echo "🚀 Iniciando Backend Local de FlysSeats"
echo ""

# Exportar variables de entorno necesarias
export COSMOS_ENDPOINT=$(cd ../infrastructure/terraform && terraform output -raw cosmos_endpoint)
export COSMOS_KEY=$(az cosmosdb keys list --name flyseats2-dev-cosmos --resource-group flyseats2-dev-rg --query "primaryMasterKey" -o tsv)
export COSMOS_DATABASE="flyseats2-db"
export AMADEUS_API_KEY="xe17wflazfXimoSkezAd7o9P18zMqGcy"
export AMADEUS_API_SECRET="6XpUbyPNk1Pfb9dF"
export REDIS_ENABLED="false"

echo "✅ Variables de entorno configuradas"
echo ""
echo "📡 Backend corriendo en: http://localhost:5000"
echo "🔗 Frontend debe apuntar a: http://localhost:5000/api"
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
