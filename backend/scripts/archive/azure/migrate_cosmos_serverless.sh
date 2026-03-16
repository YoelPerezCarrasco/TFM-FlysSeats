#!/bin/bash
# ============================================
# Migrar Cosmos DB a SERVERLESS (coste ~0€)
# ============================================
# 
# ANTES de ejecutar este script:
# 1. Ve a https://portal.azure.com → Suscripciones
# 2. Reactiva tu suscripción "Azure for Students" si está deshabilitada
# 3. Espera unos minutos hasta que el estado sea "Active"
#
# ⚠️  ESTE SCRIPT ELIMINA Y RECREA Cosmos DB.
# Los datos actuales se perderán (solo hay datos de test).
# ============================================

set -e

RG="flyseats2-dev-rg"
ACCOUNT="flyseats2-dev-cosmos"
LOCATION="germanywestcentral"
DB_NAME="flyseats2-db"

echo "============================================"
echo "  Migración Cosmos DB → Serverless"
echo "============================================"
echo ""

# Step 1: Check subscription status
echo "📋 Paso 1: Verificando suscripción..."
SUB_STATE=$(az account show --query "state" -o tsv 2>/dev/null)
if [ "$SUB_STATE" != "Enabled" ]; then
    echo "❌ La suscripción no está activa (estado: $SUB_STATE)"
    echo "   Ve a https://portal.azure.com → Suscripciones → Reactivar"
    exit 1
fi
echo "✅ Suscripción activa"

# Step 2: Export current connection info
echo ""
echo "📋 Paso 2: Guardando info de conexión actual..."
CURRENT_ENDPOINT=$(az cosmosdb show --name $ACCOUNT --resource-group $RG --query "documentEndpoint" -o tsv 2>/dev/null || echo "")
echo "   Endpoint actual: $CURRENT_ENDPOINT"

# Step 3: Confirm deletion
echo ""
echo "⚠️  Paso 3: Se va a ELIMINAR y RECREAR la cuenta Cosmos DB"
echo "   Cuenta: $ACCOUNT"
echo "   Esto eliminará todos los datos (solo hay datos de test)"
echo ""
read -p "   ¿Continuar? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cancelado."
    exit 0
fi

# Step 4: Delete existing Cosmos DB account
echo ""
echo "🗑️  Paso 4: Eliminando cuenta Cosmos DB actual..."
az cosmosdb delete \
    --name $ACCOUNT \
    --resource-group $RG \
    --yes 2>&1 && echo "✅ Cuenta eliminada" || echo "⚠️  No se pudo eliminar (puede que ya no exista)"

# Wait for deletion to propagate
echo "   Esperando propagación (30s)..."
sleep 30

# Step 5: Create new Cosmos DB with SERVERLESS
echo ""
echo "🚀 Paso 5: Creando nueva cuenta Cosmos DB SERVERLESS..."
az cosmosdb create \
    --name $ACCOUNT \
    --resource-group $RG \
    --locations regionName=$LOCATION failoverPriority=0 \
    --kind GlobalDocumentDB \
    --capabilities EnableServerless \
    --default-consistency-level Session \
    --output none

echo "✅ Cuenta Serverless creada"

# Step 6: Create database (no throughput needed for serverless)
echo ""
echo "📦 Paso 6: Creando base de datos..."
az cosmosdb sql database create \
    --account-name $ACCOUNT \
    --resource-group $RG \
    --name $DB_NAME \
    --output none

echo "✅ Base de datos creada: $DB_NAME"

# Step 7: Create containers (no RU/s needed for serverless)
echo ""
echo "📦 Paso 7: Creando contenedores..."

CONTAINERS=(
    "users:/userId"
    "flights:/flightId"
    "bookings:/userId"
    "flights-cache:/searchKey"
    "seats:/flight_id"
    "swaps:/flight_id"
)

for CONTAINER_DEF in "${CONTAINERS[@]}"; do
    NAME="${CONTAINER_DEF%%:*}"
    PK="${CONTAINER_DEF##*:}"
    
    az cosmosdb sql container create \
        --account-name $ACCOUNT \
        --resource-group $RG \
        --database-name $DB_NAME \
        --name "$NAME" \
        --partition-key-path "$PK" \
        --output none 2>/dev/null && echo "   ✅ $NAME (pk: $PK)" || echo "   ⚠️  $NAME ya existe"
done

# Step 8: Get new connection info
echo ""
echo "🔑 Paso 8: Obteniendo credenciales..."
NEW_ENDPOINT=$(az cosmosdb show --name $ACCOUNT --resource-group $RG --query "documentEndpoint" -o tsv)
NEW_KEY=$(az cosmosdb keys list --name $ACCOUNT --resource-group $RG --query "primaryMasterKey" -o tsv)

echo "   Endpoint: $NEW_ENDPOINT"
echo "   Key: ${NEW_KEY:0:20}..."

# Step 9: Update App Service settings
echo ""
echo "⚙️  Paso 9: Actualizando configuración del backend..."
az webapp config appsettings set \
    --name flyseats2-dev-api \
    --resource-group $RG \
    --settings \
        COSMOS_ENDPOINT="$NEW_ENDPOINT" \
        COSMOS_KEY="$NEW_KEY" \
        COSMOS_DATABASE="$DB_NAME" \
    --output none

echo "✅ App Settings actualizados"

# Step 10: Verify
echo ""
echo "🔍 Paso 10: Verificando configuración..."
az cosmosdb show --name $ACCOUNT --resource-group $RG \
    --query "{name:name, capacityMode:capacityMode, endpoint:documentEndpoint}" -o json

echo ""
echo "============================================"
echo "  ✅ ¡MIGRACIÓN COMPLETADA!"
echo "============================================"
echo ""
echo "  Modo: SERVERLESS (pago por uso)"
echo "  Coste estimado: < 1€/mes para TFM"
echo "  Contenedores: ${#CONTAINERS[@]}"
echo ""
echo "  Próximo paso: reiniciar el backend"
echo "  az webapp restart --name flyseats2-dev-api --resource-group $RG"
echo "============================================"
