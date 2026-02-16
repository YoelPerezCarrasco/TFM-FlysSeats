#!/bin/bash
# Script para gestionar la base de datos Cosmos DB

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Obtener credenciales de Cosmos DB
echo -e "${BLUE}🔍 Obteniendo credenciales de Cosmos DB...${NC}"
COSMOS_ENDPOINT=$(cd ../infrastructure/terraform && terraform output -raw cosmos_endpoint)
COSMOS_KEY=$(az cosmosdb keys list --name flyseats2-dev-cosmos --resource-group flyseats2-dev-rg --type keys --query "primaryMasterKey" -o tsv)
COSMOS_DB="flyseats2-db"

echo -e "${GREEN}✅ Conectado a: $COSMOS_ENDPOINT${NC}\n"

# Menú
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  📊 GESTOR DE BASE DE DATOS COSMOS DB${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Selecciona una opción:"
echo ""
echo "  1) 🔧 Inicializar contenedores"
echo "  2) 👁️  Ver contenido de la base de datos"
echo "  3) 📝 Insertar datos de prueba"
echo "  4) 🌐 Abrir en Azure Portal"
echo "  5) 📋 Ver estadísticas"
echo ""
read -p "Opción: " option

case $option in
    1)
        echo -e "\n${YELLOW}🔧 Inicializando contenedores...${NC}"
        export COSMOS_ENDPOINT=$COSMOS_ENDPOINT
        export COSMOS_KEY=$COSMOS_KEY
        export COSMOS_DATABASE=$COSMOS_DB
        python3 scripts/init_cosmos_db.py
        ;;
    2)
        echo -e "\n${YELLOW}👁️  Visualizando base de datos...${NC}"
        export COSMOS_ENDPOINT=$COSMOS_ENDPOINT
        export COSMOS_KEY=$COSMOS_KEY
        export COSMOS_DATABASE=$COSMOS_DB
        python3 scripts/view_cosmos_db.py
        ;;
    3)
        echo -e "\n${YELLOW}📝 Insertando datos de prueba...${NC}"
        export COSMOS_ENDPOINT=$COSMOS_ENDPOINT
        export COSMOS_KEY=$COSMOS_KEY
        export COSMOS_DATABASE=$COSMOS_DB
        python3 scripts/insert_test_data.py
        ;;
    4)
        echo -e "\n${GREEN}🌐 Abriendo Azure Portal...${NC}"
        URL="https://portal.azure.com/#@315255a7-9643-462c-80dd-4c895580d845/resource/subscriptions/9166d6ad-de87-4762-8a61-073036eb62aa/resourceGroups/flyseats2-dev-rg/providers/Microsoft.DocumentDB/databaseAccounts/flyseats2-dev-cosmos/dataExplorer"
        echo "URL: $URL"
        echo ""
        echo "También puedes navegar manualmente:"
        echo "1. Ir a https://portal.azure.com"
        echo "2. Buscar 'flyseats2-dev-cosmos'"
        echo "3. Click en 'Data Explorer'"
        ;;
    5)
        echo -e "\n${YELLOW}📋 Estadísticas de Cosmos DB...${NC}"
        echo ""
        echo "Base de datos:"
        az cosmosdb sql database show \
          --account-name flyseats2-dev-cosmos \
          --resource-group flyseats2-dev-rg \
          --name $COSMOS_DB \
          --query "{Name:name, ID:id}" \
          -o table
        
        echo ""
        echo "Contenedores:"
        az cosmosdb sql container list \
          --account-name flyseats2-dev-cosmos \
          --resource-group flyseats2-dev-rg \
          --database-name $COSMOS_DB \
          --query "[].{Name:name, PartitionKey:resource.partitionKey.paths[0]}" \
          -o table
        ;;
    *)
        echo -e "${YELLOW}Opción no válida${NC}"
        ;;
esac
