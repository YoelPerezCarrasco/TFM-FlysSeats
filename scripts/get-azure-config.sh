#!/bin/bash
# Script para obtener valores de configuración de Azure
# Ejecutar antes de configurar Azure DevOps Variable Groups

set -e

RESOURCE_GROUP="flyseats2-dev-rg"
COSMOS_ACCOUNT="flyseats2-dev-cosmos"
KEY_VAULT="flyseats2-dev-kv"
DATABASE_NAME="flyseats2-db"

echo "🔍 Obteniendo configuración de Azure para DevOps..."
echo ""

# Cosmos DB
echo "📊 COSMOS DB:"
echo "============="
COSMOS_ENDPOINT=$(az cosmosdb show --name $COSMOS_ACCOUNT --resource-group $RESOURCE_GROUP --query documentEndpoint -o tsv)
COSMOS_KEY=$(az cosmosdb keys list --name $COSMOS_ACCOUNT --resource-group $RESOURCE_GROUP --query primaryMasterKey -o tsv)
echo "COSMOS_ENDPOINT=$COSMOS_ENDPOINT"
echo "COSMOS_KEY=$COSMOS_KEY"
echo "COSMOS_DATABASE=$DATABASE_NAME"
echo ""

# Key Vault
echo "🔐 KEY VAULT:"
echo "============="
KEY_VAULT_URL=$(az keyvault show --name $KEY_VAULT --resource-group $RESOURCE_GROUP --query properties.vaultUri -o tsv)
echo "KEY_VAULT_URL=$KEY_VAULT_URL"
echo ""

# Amadeus API (desde Key Vault)
echo "✈️  AMADEUS API:"
echo "==============="
AMADEUS_KEY=$(az keyvault secret show --vault-name $KEY_VAULT --name amadeus-api-key --query value -o tsv 2>/dev/null || echo "NOT_FOUND")
AMADEUS_SECRET=$(az keyvault secret show --vault-name $KEY_VAULT --name amadeus-api-secret --query value -o tsv 2>/dev/null || echo "NOT_FOUND")
echo "AMADEUS_API_KEY=$AMADEUS_KEY"
echo "AMADEUS_API_SECRET=$AMADEUS_SECRET"
echo ""

# App Service
echo "🌐 APP SERVICE:"
echo "==============="
APP_NAME=$(az webapp list --resource-group $RESOURCE_GROUP --query "[0].name" -o tsv)
APP_URL=$(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostName -o tsv)
echo "APP_SERVICE_NAME=$APP_NAME"
echo "APP_SERVICE_URL=https://$APP_URL"
echo ""

# Storage Account
echo "💾 STORAGE ACCOUNT:"
echo "==================="
STORAGE_NAME=$(az storage account list --resource-group $RESOURCE_GROUP --query "[0].name" -o tsv)
echo "STORAGE_ACCOUNT=$STORAGE_NAME"
echo ""

echo "✅ Configuración obtenida exitosamente"
echo ""
echo "📝 Próximos pasos:"
echo "1. Crear Variable Group en Azure DevOps: 'FlysSeats-Backend-Config'"
echo "2. Copiar los valores de arriba (marcar secrets como 'Secret')"
echo "3. Crear Service Connection llamado 'Azure-ServiceConnection'"
echo "4. Ejecutar el pipeline de backend"
