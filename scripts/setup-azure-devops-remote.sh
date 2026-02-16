#!/bin/bash
# Script para configurar Azure DevOps como remote adicional
# Ejecutar: ./scripts/setup-azure-devops-remote.sh

set -e

echo "🔧 Configuración de Azure DevOps Remote"
echo "========================================"
echo ""

AZURE_DEVOPS_URL="https://dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats"
REMOTE_NAME="azuredevops"

if git remote | grep -q "^${REMOTE_NAME}$"; then
    echo "⚠️  Remote '${REMOTE_NAME}' ya existe"
    git remote remove ${REMOTE_NAME}
    echo "✅ Remote eliminado, agregando nuevo..."
fi

echo "📌 Necesitas un Personal Access Token (PAT) de Azure DevOps"
echo ""
echo "Pasos para crear el PAT:"
echo "1. Ve a: https://dev.azure.com/flyseats/_usersSettings/tokens"
echo "2. Click 'New Token'"
echo "3. Nombre: TFM-FlysSeats-PAT"
echo "4. Scopes: Code (Read, write, & manage)"
echo "5. Copia el token generado"
echo ""
read -p "¿Ya tienes el PAT? (y/n): " has_pat

if [[ $has_pat != "y" ]]; then
    echo "❌ Primero obtén el PAT y vuelve a ejecutar este script"
    exit 1
fi

echo ""
read -sp "Pega tu PAT aquí (no se mostrará): " PAT
echo ""

if [[ -z "$PAT" ]]; then
    echo "❌ PAT vacío. Cancelando."
    exit 1
fi

URL_WITH_PAT="https://${PAT}@dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats"
git remote add ${REMOTE_NAME} ${URL_WITH_PAT}

echo "✅ Remote '${REMOTE_NAME}' agregado"
echo ""
echo "🔍 Verificando conexión..."

if git ls-remote ${REMOTE_NAME} &> /dev/null; then
    echo "✅ Conexión exitosa"
else
    echo "❌ Falló la conexión. Verifica el PAT."
    git remote remove ${REMOTE_NAME}
    exit 1
fi

echo ""
git remote -v
echo ""

read -p "¿Hacer push inicial a Azure DevOps? (y/n): " do_push

if [[ $do_push == "y" ]]; then
    CURRENT_BRANCH=$(git branch --show-current)
    git push ${REMOTE_NAME} ${CURRENT_BRANCH} --force
    echo "✅ Push exitoso"
fi

echo ""
echo "✅ Configuración completada"
