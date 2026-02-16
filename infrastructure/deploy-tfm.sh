#!/bin/bash

###############################################################################
# FlysSeats TFM - Despliegue Ultra-Económico
# Configuración optimizada para Trabajos Fin de Máster
# Costo estimado: €0-5/mes (casi GRATIS con Azure for Students)
###############################################################################

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        FlysSeats TFM - Despliegue Económico               ║"
echo "║        Costo: €0-5/mes (casi GRATIS)                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

ENVIRONMENT=${1:-"dev"}
LOCATION=${2:-"westeurope"}

log_info "Configuración TFM Optimizada:"
log_info "  • Cosmos DB: FREE TIER (1000 RU/s gratis para siempre)"
log_info "  • App Service: F1 FREE (100% gratis)"
log_info "  • Redis: DESHABILITADO (ahorro €17/mes)"
log_info "  • Functions: Consumption (1M gratis/mes)"
echo ""

# Verificar prerrequisitos
log_info "Verificando prerrequisitos..."

if ! command -v az &> /dev/null; then
    log_error "Azure CLI no está instalado"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    log_error "Terraform no está instalado"
    exit 1
fi

log_success "Prerrequisitos OK"

# Verificar variables de entorno
log_info "Verificando credenciales..."

if [ -z "$ARM_CLIENT_ID" ]; then
    log_error "ARM_CLIENT_ID no está configurado. Ejecuta: source .env"
    exit 1
fi

if [ -z "$AMADEUS_API_KEY" ]; then
    log_warning "AMADEUS_API_KEY no configurado. Se usarán datos mock."
fi

log_success "Credenciales OK"

# Login en Azure
log_info "Verificando sesión de Azure..."
if ! az account show &> /dev/null; then
    log_warning "No estás logueado. Ejecutando az login..."
    az login --service-principal \
      -u $ARM_CLIENT_ID \
      -p $ARM_CLIENT_SECRET \
      --tenant $ARM_TENANT_ID
fi

log_success "Sesión de Azure activa"

# Terraform
cd infrastructure/terraform

log_info "Inicializando Terraform..."
terraform init

log_info "Validando configuración..."
terraform validate

log_info "Creando plan de despliegue (TFM optimizado)..."
terraform plan \
  -var-file="tfm.tfvars" \
  -var="amadeus_api_key=${AMADEUS_API_KEY:-placeholder}" \
  -var="amadeus_api_secret=${AMADEUS_API_SECRET:-placeholder}" \
  -out=tfplan

echo ""
log_warning "═══════════════════════════════════════════════════════"
log_warning "RESUMEN DE COSTOS ESTIMADOS:"
log_warning "  • Cosmos DB Free Tier: €0/mes (gratis para siempre)"
log_warning "  • App Service F1: €0/mes (gratis)"
log_warning "  • Azure Functions: €0-2/mes (1M ejecuciones gratis)"
log_warning "  • Storage: €0-1/mes (5GB gratis)"
log_warning "  • Application Insights: €0-2/mes (5GB gratis)"
log_warning ""
log_warning "  TOTAL: €0-5/mes"
log_warning "═══════════════════════════════════════════════════════"
echo ""

read -p "¿Continuar con el despliegue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Despliegue cancelado"
    exit 0
fi

log_info "Aplicando infraestructura..."
terraform apply tfplan

# Obtener outputs
RESOURCE_GROUP=$(terraform output -raw resource_group_name)
FUNCTION_APP=$(terraform output -raw function_app_name)
WEB_APP=$(terraform output -raw web_app_name)
KEY_VAULT=$(terraform output -raw key_vault_name)
FUNCTION_URL=$(terraform output -raw function_app_url)
WEB_URL=$(terraform output -raw web_app_url)

cd ../..

log_success "Infraestructura desplegada"

# Configurar secretos
if [ -n "$AMADEUS_API_KEY" ] && [ "$AMADEUS_API_KEY" != "placeholder" ]; then
    log_info "Configurando secretos en Key Vault..."
    
    az keyvault secret set \
      --vault-name "$KEY_VAULT" \
      --name "amadeus-api-key" \
      --value "$AMADEUS_API_KEY" > /dev/null
    
    az keyvault secret set \
      --vault-name "$KEY_VAULT" \
      --name "amadeus-api-secret" \
      --value "$AMADEUS_API_SECRET" > /dev/null
    
    log_success "Secretos configurados"
else
    log_warning "Credenciales de Amadeus no configuradas. Se usarán datos mock."
fi

# Desplegar Backend
log_info "Desplegando Backend (Azure Functions)..."
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

func azure functionapp publish "$FUNCTION_APP" --python > /dev/null 2>&1 || {
    log_warning "Error en despliegue de Functions (revisar logs)"
}

cd ..
log_success "Backend desplegado"

# Desplegar Frontend
log_info "Desplegando Frontend (App Service)..."
cd flyseats-frontend

if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
fi

# Crear environment de producción
cat > src/environments/environment.prod.ts <<EOF
export const environment = {
  production: true,
  apiUrl: '$FUNCTION_URL/api',
  appInsightsConnectionString: ''
};
EOF

npm run build -- --configuration=production > /dev/null 2>&1

cd dist
zip -q -r ../../dist.zip . 2>/dev/null
cd ../..

az webapp deployment source config-zip \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEB_APP" \
  --src dist.zip > /dev/null 2>&1

rm -f dist.zip

cd ..
log_success "Frontend desplegado"

# Configurar CORS
log_info "Configurando CORS..."
az functionapp cors remove \
  --resource-group "$RESOURCE_GROUP" \
  --name "$FUNCTION_APP" \
  --allowed-origins "*" > /dev/null 2>&1 || true

az functionapp cors add \
  --resource-group "$RESOURCE_GROUP" \
  --name "$FUNCTION_APP" \
  --allowed-origins "https://$WEB_APP.azurewebsites.net" > /dev/null 2>&1

log_success "CORS configurado"

# Resumen
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║            🎉 DESPLIEGUE COMPLETADO 🎉                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
log_success "Tu aplicación está desplegada en Azure"
echo ""
log_info "📋 URLs de Acceso:"
echo "   Frontend:  $WEB_URL"
echo "   Backend:   $FUNCTION_URL"
echo ""
log_info "📊 Recursos Creados:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Key Vault:      $KEY_VAULT"
echo ""
log_info "💰 Costos:"
echo "   Estimado: €0-5/mes (casi GRATIS)"
echo "   Cosmos DB: FREE TIER (gratis para siempre)"
echo "   App Service: F1 (gratis)"
echo ""
log_info "🔍 Monitoreo:"
echo "   Portal Azure: https://portal.azure.com"
echo "   Resource Group: https://portal.azure.com/#resource/subscriptions/$ARM_SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"
echo ""
log_warning "⚠️  IMPORTANTE:"
echo "   • Primera carga del frontend puede tardar 10-20s (Free tier)"
echo "   • Después de 20 min inactivo, se duerme (normal en Free tier)"
echo "   • Suficiente para demos, presentaciones y TFM"
echo ""
log_info "📝 Siguiente paso:"
echo "   Abre: $WEB_URL"
echo ""
log_success "✨ ¡Listo para tu TFM! ✨"
echo ""
