#!/bin/bash

###############################################################################
# FlysSeats - Script de Despliegue Completo en Azure
# Este script despliega toda la infraestructura y las aplicaciones en Azure
###############################################################################

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Variables (puedes cambiarlas)
ENVIRONMENT=${1:-"dev"}
LOCATION=${2:-"westeurope"}
PROJECT_NAME="flyseats"

log_info "Iniciando despliegue de FlysSeats"
log_info "Entorno: $ENVIRONMENT"
log_info "Región: $LOCATION"

###############################################################################
# 1. VERIFICAR PRERREQUISITOS
###############################################################################

log_info "Verificando prerrequisitos..."

if ! command -v az &> /dev/null; then
    log_error "Azure CLI no está instalado"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    log_error "Terraform no está instalado"
    exit 1
fi

if ! command -v func &> /dev/null; then
    log_error "Azure Functions Core Tools no está instalado"
    exit 1
fi

if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado"
    exit 1
fi

log_success "Todos los prerrequisitos están instalados"

###############################################################################
# 2. LOGIN A AZURE
###############################################################################

log_info "Verificando login en Azure..."

if ! az account show &> /dev/null; then
    log_warning "No estás logueado en Azure"
    az login
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
log_success "Conectado a Azure (Subscription: $SUBSCRIPTION_ID)"

###############################################################################
# 3. DESPLEGAR INFRAESTRUCTURA CON TERRAFORM
###############################################################################

log_info "Desplegando infraestructura con Terraform..."

cd infrastructure/terraform

# Inicializar Terraform
log_info "Inicializando Terraform..."
terraform init

# Validar configuración
log_info "Validando configuración de Terraform..."
terraform validate

# Planificar cambios
log_info "Planificando cambios..."
terraform plan \
    -var="environment=$ENVIRONMENT" \
    -var="location=$LOCATION" \
    -out=tfplan

# Preguntar confirmación
read -p "¿Deseas aplicar estos cambios? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Despliegue cancelado"
    exit 1
fi

# Aplicar cambios
log_info "Aplicando infraestructura..."
terraform apply tfplan

# Obtener outputs
log_info "Obteniendo información de la infraestructura..."
RESOURCE_GROUP=$(terraform output -raw resource_group_name)
FUNCTION_APP_NAME=$(terraform output -raw function_app_name)
WEB_APP_NAME=$(terraform output -raw web_app_name)
FUNCTION_APP_URL=$(terraform output -raw function_app_url)
WEB_APP_URL=$(terraform output -raw web_app_url)
KEY_VAULT_NAME=$(terraform output -raw key_vault_name)

log_success "Infraestructura desplegada correctamente"
log_info "Resource Group: $RESOURCE_GROUP"
log_info "Function App: $FUNCTION_APP_NAME"
log_info "Web App: $WEB_APP_NAME"

cd ../..

###############################################################################
# 4. CONFIGURAR SECRETOS EN KEY VAULT
###############################################################################

log_warning "⚠️  IMPORTANTE: Debes configurar las credenciales de Amadeus API"
log_info "Si tienes las credenciales, puedes configurarlas ahora:"

read -p "¿Tienes las credenciales de Amadeus API? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Amadeus API Key: " AMADEUS_KEY
    read -sp "Amadeus API Secret: " AMADEUS_SECRET
    echo
    
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "amadeus-api-key" \
        --value "$AMADEUS_KEY"
    
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "amadeus-api-secret" \
        --value "$AMADEUS_SECRET"
    
    log_success "Secretos configurados en Key Vault"
else
    log_warning "Secretos no configurados. El sistema usará datos mock."
    log_info "Puedes configurarlos después con:"
    log_info "az keyvault secret set --vault-name $KEY_VAULT_NAME --name amadeus-api-key --value YOUR_KEY"
    log_info "az keyvault secret set --vault-name $KEY_VAULT_NAME --name amadeus-api-secret --value YOUR_SECRET"
fi

###############################################################################
# 5. DESPLEGAR BACKEND (Azure Functions)
###############################################################################

log_info "Desplegando Azure Functions..."

cd backend

# Instalar dependencias
log_info "Instalando dependencias de Python..."
pip install -r requirements.txt

# Desplegar
log_info "Desplegando funciones a Azure..."
func azure functionapp publish "$FUNCTION_APP_NAME" --python

log_success "Backend desplegado correctamente"

cd ..

###############################################################################
# 6. DESPLEGAR FRONTEND (Angular Web App)
###############################################################################

log_info "Desplegando Frontend..."

cd flyseats-frontend

# Instalar dependencias
log_info "Instalando dependencias de npm..."
npm install

# Configurar environment
log_info "Configurando variables de entorno..."
cat > src/environments/environment.prod.ts <<EOF
export const environment = {
  production: true,
  apiUrl: '$FUNCTION_APP_URL',
  appInsightsConnectionString: '', // Se configura automáticamente desde Azure
};
EOF

# Build de producción
log_info "Compilando aplicación Angular..."
npm run build -- --configuration=production

# Crear archivo zip para deployment
log_info "Preparando deployment package..."
cd dist
zip -r ../dist.zip .
cd ..

# Desplegar a Azure Web App
log_info "Desplegando a Azure Web App..."
az webapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$WEB_APP_NAME" \
    --src dist.zip

log_success "Frontend desplegado correctamente"

cd ..

###############################################################################
# 7. CONFIGURACIÓN POST-DESPLIEGUE
###############################################################################

log_info "Configuración post-despliegue..."

# Habilitar logging
az webapp log config \
    --resource-group "$RESOURCE_GROUP" \
    --name "$WEB_APP_NAME" \
    --application-logging filesystem \
    --detailed-error-messages true \
    --failed-request-tracing true \
    --level information

az functionapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$FUNCTION_APP_NAME" \
    --settings "AzureWebJobsFeatureFlags=EnableWorkerIndexing"

log_success "Configuración post-despliegue completada"

###############################################################################
# 8. VERIFICAR DESPLIEGUE
###############################################################################

log_info "Verificando despliegue..."

# Verificar Function App
FUNC_STATUS=$(az functionapp show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$FUNCTION_APP_NAME" \
    --query "state" -o tsv)

if [ "$FUNC_STATUS" == "Running" ]; then
    log_success "Function App está corriendo"
else
    log_warning "Function App status: $FUNC_STATUS"
fi

# Verificar Web App
WEB_STATUS=$(az webapp show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$WEB_APP_NAME" \
    --query "state" -o tsv)

if [ "$WEB_STATUS" == "Running" ]; then
    log_success "Web App está corriendo"
else
    log_warning "Web App status: $WEB_STATUS"
fi

###############################################################################
# 9. RESUMEN
###############################################################################

echo ""
echo "═══════════════════════════════════════════════════════════════"
log_success "🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE 🎉"
echo "═══════════════════════════════════════════════════════════════"
echo ""
log_info "📋 URLs de Acceso:"
echo "   Frontend:  $WEB_APP_URL"
echo "   Backend:   $FUNCTION_APP_URL"
echo ""
log_info "📋 Recursos de Azure:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Key Vault:      $KEY_VAULT_NAME"
echo ""
log_info "📋 Monitoreo:"
echo "   Application Insights: https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/microsoft.insights/components/*"
echo ""
log_info "📋 Próximos Pasos:"
echo "   1. Visita $WEB_APP_URL para ver tu aplicación"
echo "   2. Verifica los logs en Application Insights"
echo "   3. Configura un dominio personalizado si lo deseas"
echo "   4. Configura CI/CD con GitHub Actions"
echo ""
echo "═══════════════════════════════════════════════════════════════"

# Abrir en navegador (opcional)
read -p "¿Deseas abrir la aplicación en el navegador? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Abriendo aplicación..."
    xdg-open "$WEB_APP_URL" 2>/dev/null || open "$WEB_APP_URL" 2>/dev/null || echo "Abre manualmente: $WEB_APP_URL"
fi

log_success "✨ Despliegue finalizado ✨"
