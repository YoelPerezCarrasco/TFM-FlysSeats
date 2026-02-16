#!/bin/bash
# Método alternativo: Usar Publish Profile del App Service
# Esto no requiere permisos de Service Principal

set -e

echo "🔧 Configuración Simplificada de GitHub Actions"
echo "==============================================="
echo ""
echo "Como Azure for Students no permite crear Service Principals,"
echo "usaremos el Publish Profile del App Service."
echo ""

RESOURCE_GROUP="flyseats2-dev-rg"
APP_NAME="flyseats2-dev-api"

echo "📥 Descargando Publish Profile..."
echo ""

# Obtener publish profile
PUBLISH_PROFILE=$(az webapp deployment list-publishing-profiles \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --xml)

echo "✅ Publish Profile obtenido"
echo ""
echo "=========================================="
echo "AZURE_WEBAPP_PUBLISH_PROFILE:"
echo "=========================================="
echo "$PUBLISH_PROFILE"
echo "=========================================="
echo ""

echo "📝 Próximos pasos:"
echo ""
echo "1. Copiar TODA la salida anterior (desde <?xml hasta </publishData>)"
echo ""
echo "2. Ir a GitHub Secrets:"
echo "   https://github.com/YoelPerezCarrasco/TFM-FlysSeats/settings/secrets/actions"
echo ""
echo "3. Click 'New repository secret'"
echo ""
echo "4. Name: AZURE_WEBAPP_PUBLISH_PROFILE"
echo ""
echo "5. Value: Pegar el XML completo"
echo ""
echo "6. Click 'Add secret'"
echo ""
echo "7. El workflow ya está configurado y funcionará automáticamente"
echo ""

# Guardar en archivo temporal
TEMP_FILE="/tmp/publish-profile-$(date +%s).xml"
echo "$PUBLISH_PROFILE" > "$TEMP_FILE"
echo "💾 Publish Profile guardado en: $TEMP_FILE"
echo "   (Eliminar después de agregarlo a GitHub)"
