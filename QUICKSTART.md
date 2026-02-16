# 🚀 Quick Start - Despliegue en Azure

## ⚡ Despliegue en 5 Minutos

### 1. Pre-requisitos (2 min)

```bash
# Instalar Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Instalar Terraform
sudo apt update
sudo apt install terraform

# Login en Azure
az login
```

### 2. Configurar Variables (1 min)

```bash
# Copiar plantilla
cp .env.example .env

# Editar con tus credenciales
nano .env
```

**Contenido de `.env`:**
```bash
# Azure
export ARM_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export ARM_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export ARM_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export ARM_SUBSCRIPTION_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Amadeus (opcional para dev)
export AMADEUS_API_KEY="your-key"
export AMADEUS_API_SECRET="your-secret"
```

```bash
# Cargar variables
source .env
```

### 3. Desplegar (2 min)

```bash
# Dar permisos
chmod +x infrastructure/deploy.sh

# Ejecutar despliegue
./infrastructure/deploy.sh dev westeurope
```

**¡Listo! Tu aplicación estará desplegada en Azure.**

---

## 📋 URLs de Acceso

Después del despliegue, verás en la consola:

```
✅ DESPLIEGUE COMPLETADO EXITOSAMENTE

📋 URLs de Acceso:
   Frontend:  https://flyseats-dev-webapp.azurewebsites.net
   Backend:   https://flyseats-dev-functions.azurewebsites.net/api
```

---

## 🧪 Probar la Aplicación

### Test del Frontend
```bash
# Abrir en navegador
xdg-open https://flyseats-dev-webapp.azurewebsites.net
```

### Test del Backend (API)
```bash
# Buscar vuelos
curl -X POST https://flyseats-dev-functions.azurewebsites.net/api/flights \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "MAD",
    "destination": "BCN",
    "departureDate": "2026-03-15",
    "adults": 1
  }'
```

---

## 🔄 Comandos Útiles

### Ver Logs en Vivo
```bash
# Backend
az webapp log tail --name flyseats-dev-functions \
  --resource-group flyseats-dev-rg

# Frontend
az webapp log tail --name flyseats-dev-webapp \
  --resource-group flyseats-dev-rg
```

### Ver Costos
```bash
az consumption usage list \
  --start-date "2026-02-01" \
  --end-date "2026-02-28" \
  --query "[?contains(instanceName,'flyseats')].{Service:instanceName,Cost:pretaxCost}"
```

### Re-desplegar Código

**Backend:**
```bash
cd backend
func azure functionapp publish flyseats-dev-functions
```

**Frontend:**
```bash
cd flyseats-frontend
npm run build -- --configuration=production
az webapp deployment source config-zip \
  --resource-group flyseats-dev-rg \
  --name flyseats-dev-webapp \
  --src dist.zip
```

### Destruir Infraestructura
```bash
cd infrastructure/terraform
terraform destroy -var="environment=dev"
```

---

## 🆘 Ayuda Rápida

### Si algo falla:

1. **Verificar login de Azure:**
   ```bash
   az account show
   ```

2. **Verificar variables de entorno:**
   ```bash
   env | grep ARM_
   ```

3. **Ver logs de Terraform:**
   ```bash
   cd infrastructure/terraform
   terraform plan -var="environment=dev"
   ```

4. **Ver documentación completa:**
   - [AZURE_REAL_DEPLOYMENT.md](AZURE_REAL_DEPLOYMENT.md)
   - [AZURE_COSTS_BREAKDOWN.md](AZURE_COSTS_BREAKDOWN.md)

---

## 📱 Siguientes Pasos

1. ✅ Obtener credenciales de Amadeus (https://developers.amadeus.com/)
2. ✅ Configurar dominio personalizado
3. ✅ Configurar CI/CD con GitHub Actions
4. ✅ Configurar alertas de monitoreo
5. ✅ Revisar costos en Azure Portal

---

**¿Necesitas ayuda?** Ver [AZURE_REAL_DEPLOYMENT.md](AZURE_REAL_DEPLOYMENT.md) para la guía completa.
