#!/bin/bash
# Script para crear Azure Service Principal y obtener credenciales para GitHub Actions

set -e

echo "🔧 Configuración de GitHub Actions con Azure"
echo "============================================"
echo ""

# Obtener información de Azure
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
RESOURCE_GROUP="flyseats2-dev-rg"

echo "📊 Información de Azure:"
echo "  Subscription: $SUBSCRIPTION_NAME"
echo "  Subscription ID: $SUBSCRIPTION_ID"
echo "  Tenant ID: $TENANT_ID"
echo "  Resource Group: $RESOURCE_GROUP"
echo ""

# Crear Service Principal
echo "🔐 Creando Service Principal para GitHub Actions..."
echo ""

SP_NAME="github-actions-flyseats-$(date +%s)"

CREDENTIALS=$(az ad sp create-for-rbac \
  --name "$SP_NAME" \
  --role contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
  --sdk-auth)

echo "✅ Service Principal creado exitosamente"
echo ""
echo "📋 AZURE_CREDENTIALS para GitHub Secret:"
echo "=========================================="
echo "$CREDENTIALS"
echo "=========================================="
echo ""

echo "📝 Próximos pasos:"
echo ""
echo "1. Copiar el JSON de arriba (desde { hasta })"
echo ""
echo "2. Ir a GitHub:"
echo "   https://github.com/YoelPerezCarrasco/TFM-FlysSeats/settings/secrets/actions"
echo ""
echo "3. Click 'New repository secret'"
echo ""
echo "4. Name: AZURE_CREDENTIALS"
echo ""
echo "5. Value: Pegar el JSON copiado"
echo ""
echo "6. Click 'Add secret'"
echo ""
echo "7. Hacer push de los workflows:"
echo "   cd ~/TFM/TFM-FlysSeats"
echo "   git add .github/workflows/"
echo "   git commit -m 'ci: Add GitHub Actions workflows'"
echo "   git push origin main"
echo ""
echo "8. Ver el pipeline en acción:"
echo "   https://github.com/YoelPerezCarrasco/TFM-FlysSeats/actions"
echo ""

# Guardar en archivo temporal (por seguridad)
TEMP_FILE=$(mktemp)
echo "$CREDENTIALS" > "$TEMP_FILE"
echo "💾 Credenciales guardadas temporalmente en: $TEMP_FILE"
echo "   (Eliminar después de agregar a GitHub Secrets)"
