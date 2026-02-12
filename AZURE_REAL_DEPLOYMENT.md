# FlysSeats - Guía de Despliegue Real en Azure (Producción)

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Arquitectura de Azure](#arquitectura-de-azure)
3. [Configuración Inicial](#configuración-inicial)
4. [Despliegue de Infraestructura](#despliegue-de-infraestructura)
5. [Configuración de Servicios](#configuración-de-servicios)
6. [Despliegue de Aplicaciones](#despliegue-de-aplicaciones)
7. [Integración con Amadeus API](#integración-con-amadeus-api)
8. [CI/CD con GitHub Actions](#cicd-con-github-actions)
9. [Monitoreo y Logging](#monitoreo-y-logging)
10. [Costos Estimados](#costos-estimados)

---

## 📦 Requisitos Previos

### Herramientas Necesarias

```bash
# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Azure Functions Core Tools
wget -q https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install azure-functions-core-tools-4

# Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.9+
sudo apt-get install python3.9 python3-pip
```

### Cuentas Necesarias

- ✅ Suscripción de Azure activa ([Crear cuenta gratuita](https://azure.microsoft.com/free/))
- ✅ Cuenta de GitHub para CI/CD
- ✅ Cuenta de Amadeus API ([Registrarse aquí](https://developers.amadeus.com/))

---

## 🏗️ Arquitectura de Azure

### Servicios Implementados

```
┌─────────────────────────────────────────────────────────────┐
│                      AZURE CLOUD                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────────┐                │
│  │   CDN        │──────▶│   Web App        │                │
│  │ (Producción) │      │   (Angular)      │                │
│  └──────────────┘      └──────────────────┘                │
│                               │                              │
│                               ▼                              │
│                    ┌──────────────────┐                     │
│                    │  API Management  │ (Prod)              │
│                    └──────────────────┘                     │
│                               │                              │
│                               ▼                              │
│  ┌───────────────────────────────────────────────┐          │
│  │         Azure Functions (Backend)             │          │
│  │  ┌──────┐  ┌──────────┐  ┌─────────┐         │          │
│  │  │ Auth │  │ Flights  │  │Bookings │         │          │
│  │  └──────┘  └──────────┘  └─────────┘         │          │
│  └───────────────────────────────────────────────┘          │
│         │              │                │                   │
│         ▼              ▼                ▼                   │
│  ┌──────────┐   ┌───────────┐   ┌──────────────┐          │
│  │ Cosmos   │   │   Redis   │   │  Key Vault   │          │
│  │   DB     │   │   Cache   │   │  (Secrets)   │          │
│  └──────────┘   └───────────┘   └──────────────┘          │
│         │                               │                   │
│         ▼                               ▼                   │
│  ┌──────────────┐           ┌──────────────────┐          │
│  │ Application  │           │   Log Analytics  │          │
│  │  Insights    │           │    Workspace     │          │
│  └──────────────┘           └──────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Amadeus API    │ (Externo)
│  Flight Search  │
└─────────────────┘
```

### Recursos de Azure por Servicio

| Servicio | Tipo de Recurso | SKU | Propósito |
|----------|----------------|-----|-----------|
| **Compute** |
| Azure Functions | Linux Consumption/EP1 | Y1/EP1 | Backend API |
| App Service Web App | Linux B1/S1 | B1/S1 | Frontend Angular |
| **Base de Datos** |
| Cosmos DB | Serverless | - | Base de datos NoSQL |
| Redis Cache | Basic/Standard | C0/C1 | Cache de alto rendimiento |
| **Storage** |
| Storage Account (Functions) | Standard LRS/GRS | - | Archivos de Functions |
| Storage Account (Data) | Standard LRS/GRS | - | Tickets, documentos |
| **Seguridad** |
| Key Vault | Standard | - | Gestión de secretos |
| **Monitoreo** |
| Application Insights | - | - | Telemetría y logs |
| Log Analytics | PerGB2018 | - | Análisis de logs |
| **Networking** |
| CDN Profile | Standard Microsoft | - | Distribución global (prod) |
| API Management | Consumption | - | Gateway API (prod) |

---

## ⚙️ Configuración Inicial

### 1. Login en Azure

```bash
# Login
az login

# Seleccionar suscripción
az account list --output table
az account set --subscription "<SUBSCRIPTION_ID>"

# Verificar suscripción activa
az account show
```

### 2. Crear Service Principal para Terraform

```bash
# Crear Service Principal
az ad sp create-for-rbac \
  --name "flyseats-terraform-sp" \
  --role="Contributor" \
  --scopes="/subscriptions/<SUBSCRIPTION_ID>"
```

**Guardar el output:**
```json
{
  "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "displayName": "flyseats-terraform-sp",
  "password": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "tenant": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### 3. Configurar Variables de Entorno

```bash
# Crear archivo .env (NO SUBIR A GIT)
cat > .env <<EOF
# Azure Credentials
export ARM_CLIENT_ID="<appId>"
export ARM_CLIENT_SECRET="<password>"
export ARM_TENANT_ID="<tenant>"
export ARM_SUBSCRIPTION_ID="<SUBSCRIPTION_ID>"

# Amadeus API (obtener de https://developers.amadeus.com/)
export AMADEUS_API_KEY="<your-amadeus-api-key>"
export AMADEUS_API_SECRET="<your-amadeus-api-secret>"
EOF

# Cargar variables
source .env
```

---

## 🚀 Despliegue de Infraestructura

### Opción 1: Script Automático (Recomendado)

```bash
# Dar permisos de ejecución
chmod +x infrastructure/deploy.sh

# Ejecutar despliegue completo
./infrastructure/deploy.sh dev westeurope

# Para producción
./infrastructure/deploy.sh prod westeurope
```

### Opción 2: Manual con Terraform

```bash
cd infrastructure/terraform

# 1. Inicializar Terraform
terraform init

# 2. Crear workspace para el entorno
terraform workspace new dev
terraform workspace select dev

# 3. Validar configuración
terraform validate

# 4. Ver plan de ejecución
terraform plan \
  -var="environment=dev" \
  -var="location=westeurope" \
  -var="amadeus_api_key=$AMADEUS_API_KEY" \
  -var="amadeus_api_secret=$AMADEUS_API_SECRET" \
  -out=tfplan

# 5. Aplicar infraestructura
terraform apply tfplan

# 6. Guardar outputs
terraform output -json > outputs.json
```

### Outputs Importantes

```bash
# Ver todos los outputs
terraform output

# Outputs específicos
export RESOURCE_GROUP=$(terraform output -raw resource_group_name)
export FUNCTION_APP=$(terraform output -raw function_app_name)
export WEB_APP=$(terraform output -raw web_app_name)
export KEY_VAULT=$(terraform output -raw key_vault_name)
```

---

## 🔐 Configuración de Servicios

### 1. Configurar Secretos en Key Vault

```bash
# Credenciales de Amadeus
az keyvault secret set \
  --vault-name "$KEY_VAULT" \
  --name "amadeus-api-key" \
  --value "$AMADEUS_API_KEY"

az keyvault secret set \
  --vault-name "$KEY_VAULT" \
  --name "amadeus-api-secret" \
  --value "$AMADEUS_API_SECRET"

# JWT Secret (generar uno aleatorio)
JWT_SECRET=$(openssl rand -base64 32)
az keyvault secret set \
  --vault-name "$KEY_VAULT" \
  --name "jwt-secret-key" \
  --value "$JWT_SECRET"

# Verificar secretos
az keyvault secret list --vault-name "$KEY_VAULT" --output table
```

### 2. Configurar Cosmos DB

Los contenedores ya están creados por Terraform, pero puedes verificar:

```bash
# Listar bases de datos
az cosmosdb sql database list \
  --resource-group "$RESOURCE_GROUP" \
  --account-name "<cosmos-account-name>"

# Listar contenedores
az cosmosdb sql container list \
  --resource-group "$RESOURCE_GROUP" \
  --account-name "<cosmos-account-name>" \
  --database-name "flyseats-db"
```

### 3. Verificar Redis Cache

```bash
# Obtener información de Redis
az redis show \
  --resource-group "$RESOURCE_GROUP" \
  --name "<redis-name>"

# Test de conexión
az redis list-keys \
  --resource-group "$RESOURCE_GROUP" \
  --name "<redis-name>"
```

---

## 📱 Despliegue de Aplicaciones

### 1. Desplegar Backend (Azure Functions)

```bash
cd backend

# Instalar dependencias
pip install -r requirements.txt

# Desplegar a Azure
func azure functionapp publish "$FUNCTION_APP" --python

# Verificar despliegue
az functionapp show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$FUNCTION_APP" \
  --query "state"

# Ver logs en tiempo real
func azure functionapp logstream "$FUNCTION_APP"
```

### 2. Desplegar Frontend (Angular)

```bash
cd flyseats-frontend

# Instalar dependencias
npm install

# Crear archivo de configuración de producción
cat > src/environments/environment.prod.ts <<EOF
export const environment = {
  production: true,
  apiUrl: 'https://$FUNCTION_APP.azurewebsites.net/api',
  appInsightsConnectionString: '$(az monitor app-insights component show \
    --resource-group $RESOURCE_GROUP \
    --app $(terraform output -raw application_insights_name) \
    --query connectionString -o tsv)'
};
EOF

# Build de producción
npm run build -- --configuration=production

# Crear archivo zip para deployment
cd dist/flyseats-frontend
zip -r ../../dist.zip .
cd ../..

# Desplegar a Azure
az webapp deployment source config-zip \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEB_APP" \
  --src dist.zip

# Verificar despliegue
az webapp show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEB_APP" \
  --query "state"
```

### 3. Configurar CORS y Dominios

```bash
# Configurar CORS en Functions
az functionapp cors add \
  --resource-group "$RESOURCE_GROUP" \
  --name "$FUNCTION_APP" \
  --allowed-origins "https://$WEB_APP.azurewebsites.net"

# (Opcional) Añadir dominio personalizado
az webapp config hostname add \
  --resource-group "$RESOURCE_GROUP" \
  --webapp-name "$WEB_APP" \
  --hostname "www.tudominio.com"
```

---

## ✈️ Integración con Amadeus API

### 1. Obtener Credenciales de Amadeus

1. Regístrate en: https://developers.amadeus.com/
2. Crea una nueva aplicación
3. Copia tu **API Key** y **API Secret**
4. Selecciona el entorno:
   - **Test**: Para desarrollo (datos ficticios)
   - **Production**: Para producción (datos reales, requiere aprobación)

### 2. Configurar Credenciales

```bash
# Ya lo hicimos en el paso anterior, pero puedes verificar
az keyvault secret show \
  --vault-name "$KEY_VAULT" \
  --name "amadeus-api-key" \
  --query "value"
```

### 3. Probar la Integración

```bash
# Test local
cd backend
python -c "
from utils.amadeus_client import amadeus_client
flights = amadeus_client.search_flights(
    origin='MAD',
    destination='BCN',
    departure_date='2026-03-15',
    adults=1
)
print(f'Encontrados {len(flights)} vuelos')
"

# Test en Azure (usando curl)
FUNCTION_URL="https://$FUNCTION_APP.azurewebsites.net/api/flights"
curl -X POST $FUNCTION_URL \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "MAD",
    "destination": "BCN",
    "departureDate": "2026-03-15",
    "adults": 1
  }'
```

---

## 🔄 CI/CD con GitHub Actions

### 1. Configurar Secretos en GitHub

Ve a tu repositorio → Settings → Secrets and variables → Actions

Añade estos secretos:

- `AZURE_CREDENTIALS`: Output del Service Principal
- `AZURE_SUBSCRIPTION_ID`: ID de tu suscripción
- `AZURE_RESOURCE_GROUP`: Nombre del resource group
- `AZURE_FUNCTIONAPP_NAME`: Nombre de la Function App
- `AZURE_WEBAPP_NAME`: Nombre de la Web App

### 2. Crear Workflow de GitHub Actions

Archivo: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main, develop ]
  workflow_dispatch:

env:
  AZURE_FUNCTIONAPP_NAME: ${{ secrets.AZURE_FUNCTIONAPP_NAME }}
  AZURE_WEBAPP_NAME: ${{ secrets.AZURE_WEBAPP_NAME }}
  NODE_VERSION: '18.x'
  PYTHON_VERSION: '3.9'

jobs:
  deploy-infrastructure:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      
      - name: Terraform Init
        run: |
          cd infrastructure/terraform
          terraform init
      
      - name: Terraform Plan
        run: |
          cd infrastructure/terraform
          terraform plan -var="environment=prod"
        env:
          ARM_CLIENT_ID: ${{ secrets.ARM_CLIENT_ID }}
          ARM_CLIENT_SECRET: ${{ secrets.ARM_CLIENT_SECRET }}
          ARM_TENANT_ID: ${{ secrets.ARM_TENANT_ID }}
          ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    needs: deploy-infrastructure
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Deploy to Azure Functions
        uses: Azure/functions-action@v1
        with:
          app-name: ${{ env.AZURE_FUNCTIONAPP_NAME }}
          package: './backend'
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}

  deploy-frontend:
    runs-on: ubuntu-latest
    needs: deploy-infrastructure
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: './flyseats-frontend/package-lock.json'
      
      - name: Install dependencies
        run: |
          cd flyseats-frontend
          npm ci
      
      - name: Build
        run: |
          cd flyseats-frontend
          npm run build -- --configuration=production
      
      - name: Deploy to Azure Web App
        uses: Azure/webapps-deploy@v2
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          package: './flyseats-frontend/dist'
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

---

## 📊 Monitoreo y Logging

### 1. Application Insights

```bash
# Ver métricas en tiempo real
az monitor app-insights metrics show \
  --resource-group "$RESOURCE_GROUP" \
  --app "$(terraform output -raw application_insights_name)" \
  --metric "requests/count" \
  --aggregation "sum"

# Ver logs
az monitor app-insights query \
  --resource-group "$RESOURCE_GROUP" \
  --app "$(terraform output -raw application_insights_name)" \
  --analytics-query "requests | take 10"
```

### 2. Configurar Alertas

```bash
# Crear alerta para errores
az monitor metrics alert create \
  --name "high-error-rate" \
  --resource-group "$RESOURCE_GROUP" \
  --scopes $(terraform output -raw function_app_id) \
  --condition "count requests/failed > 10" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group "<action-group-id>"
```

### 3. Ver Logs en Tiempo Real

```bash
# Function App logs
az webapp log tail \
  --resource-group "$RESOURCE_GROUP" \
  --name "$FUNCTION_APP"

# Web App logs
az webapp log tail \
  --resource-group "$RESOURCE_GROUP" \
  --name "$WEB_APP"
```

---

## 💰 Costos Estimados

### Entorno de Desarrollo (dev)

| Servicio | SKU | Costo Mensual Aprox. |
|----------|-----|---------------------|
| Azure Functions | Consumption Y1 | €0 - €15 |
| App Service | B1 | €14 |
| Cosmos DB | Serverless | €5 - €30 |
| Redis Cache | Basic C0 | €17 |
| Storage Account | Standard LRS | €2 - €5 |
| Application Insights | Pay-as-you-go | €0 - €5 |
| Key Vault | Standard | €0.03/10k ops |
| **TOTAL MENSUAL** | | **€40 - €90** |

### Entorno de Producción (prod)

| Servicio | SKU | Costo Mensual Aprox. |
|----------|-----|---------------------|
| Azure Functions | Premium EP1 | €145 |
| App Service | S1 | €70 |
| Cosmos DB | Serverless | €30 - €200 |
| Redis Cache | Standard C1 | €63 |
| Storage Account | Standard GRS | €5 - €15 |
| Application Insights | Pay-as-you-go | €10 - €50 |
| CDN | Standard Microsoft | €8 + tráfico |
| API Management | Consumption | €3.50/M calls |
| Key Vault | Standard | €0.03/10k ops |
| **TOTAL MENSUAL** | | **€330 - €600** |

> **Nota**: Estos son costos aproximados. Los costos reales dependen del uso.

---

## 🎯 Checklist de Despliegue

- [ ] Herramientas instaladas (az, terraform, func, node)
- [ ] Login en Azure completado
- [ ] Service Principal creado
- [ ] Variables de entorno configuradas
- [ ] Credenciales de Amadeus obtenidas
- [ ] Terraform init y apply ejecutados
- [ ] Secretos configurados en Key Vault
- [ ] Backend desplegado y funcionando
- [ ] Frontend desplegado y funcionando
- [ ] CORS configurado correctamente
- [ ] Pruebas de integración exitosas
- [ ] Application Insights configurado
- [ ] Alertas creadas
- [ ] CI/CD configurado en GitHub
- [ ] Documentación actualizada
- [ ] Costos monitoreados

---

## 🆘 Troubleshooting

### Error: "Failed to connect to Cosmos DB"

```bash
# Verificar firewall de Cosmos DB
az cosmosdb show \
  --resource-group "$RESOURCE_GROUP" \
  --name "<cosmos-name>" \
  --query "ipRules"

# Añadir IP actual
az cosmosdb update \
  --resource-group "$RESOURCE_GROUP" \
  --name "<cosmos-name>" \
  --ip-range-filter "$(curl -s ifconfig.me)"
```

### Error: "Amadeus API key not found"

```bash
# Verificar que el Function App tiene acceso al Key Vault
az keyvault set-policy \
  --name "$KEY_VAULT" \
  --object-id $(az functionapp identity show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$FUNCTION_APP" \
    --query principalId -o tsv) \
  --secret-permissions get list
```

### Error: "CORS policy blocked"

```bash
# Configurar CORS correctamente
az functionapp cors remove \
  --resource-group "$RESOURCE_GROUP" \
  --name "$FUNCTION_APP" \
  --allowed-origins "*"

az functionapp cors add \
  --resource-group "$RESOURCE_GROUP" \
  --name "$FUNCTION_APP" \
  --allowed-origins "https://$WEB_APP.azurewebsites.net"
```

---

## 📚 Recursos Adicionales

- [Documentación de Azure Functions](https://docs.microsoft.com/azure/azure-functions/)
- [Amadeus API Reference](https://developers.amadeus.com/self-service)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure Cost Calculator](https://azure.microsoft.com/pricing/calculator/)

---

**✨ ¡Tu aplicación FlysSeats está lista para producción en Azure! ✨**
