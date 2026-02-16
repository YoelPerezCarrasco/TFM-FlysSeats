#!/bin/bash

# Startup script para Azure App Service
# Este script inicia la aplicación Flask con Gunicorn

echo "🚀 Iniciando FlysSeats Backend API..."

# Activar variables de entorno si existen
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Instalar dependencias si es necesario
if [ ! -d "venv" ]; then
    echo "📦 Instalando dependencias..."
    python -m pip install --upgrade pip
    pip install -r requirements.txt
fi

# Iniciar Gunicorn
echo "✅ Iniciando servidor Gunicorn..."
cd /home/site/wwwroot
gunicorn --bind=0.0.0.0:8000 --timeout 600 --workers=4 app:app
