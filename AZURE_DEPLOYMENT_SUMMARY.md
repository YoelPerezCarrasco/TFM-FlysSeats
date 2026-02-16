# 🚀 FlysSeats - Despliegue Real en Azure

## ✅ Implementación Completa para Producción

Este proyecto ahora incluye **infraestructura completa de Azure** lista para producción, con integración real de servicios cloud y API externa de Amadeus para búsqueda de vuelos.

---

## 📁 Archivos Importantes Creados

### 📋 Documentación
- **[AZURE_REAL_DEPLOYMENT.md](AZURE_REAL_DEPLOYMENT.md)** - Guía completa paso a paso para desplegar en Azure
- **[AZURE_COSTS_BREAKDOWN.md](AZURE_COSTS_BREAKDOWN.md)** - Análisis detallado de costos por servicio
- `.github/workflows/deploy-azure.yml` - Pipeline CI/CD completo

### 🏗️ Infraestructura (Terraform)
- `infrastructure/terraform/resources.tf` - Todos los recursos de Azure
- `infrastructure/terraform/variables.tf` - Variables configurables
- `infrastructure/terraform/outputs.tf` - Outputs importantes
- `infrastructure/deploy.sh` - Script de despliegue automatizado

### ⚙️ Backend (Python Azure Functions)
- `backend/config.py` - Configuración centralizada
- `backend/requirements.txt` - Dependencias actualizadas
- `backend/utils/cosmos_client.py` - Cliente de Cosmos DB
- `backend/utils/redis_client.py` - Cliente de Redis Cache
- `backend/utils/amadeus_client.py` - Integración con Amadeus API
- `backend/functions/auth/__init__.py` - Autenticación con JWT
- `backend/functions/flights/__init__.py` - Búsqueda de vuelos real
- `backend/functions/bookings/__init__.py` - Gestión de reservas

---

## 🏗️ Arquitectura de Azure Implementada

### Servicios de Azure Desplegados

```
┌──────────────────────────────────────────────────┐
│           FRONTEND (Angular)                     │
│  • Azure Web App (App Service)                   │
│  • CDN para distribución global (prod)           │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│         BACKEND (Azure Functions)                │
│  • /api/auth - Autenticación JWT                 │
│  • /api/flights - Búsqueda de vuelos (Amadeus)   │
│  • /api/bookings - Gestión de reservas           │
└──────────────────────────────────────────────────┘
         ↓              ↓                ↓
┌──────────────┐  ┌──────────┐  ┌────────────────┐
│  Cosmos DB   │  │  Redis   │  │   Key Vault    │
│  (Database)  │  │  (Cache) │  │   (Secrets)    │
└──────────────┘  └──────────┘  └────────────────┘
                                        ↓
                              ┌────────────────────┐
                              │  Amadeus API       │
                              │  (Vuelos Reales)   │
                              └────────────────────┘
```

### Componentes Implementados

#### 1. **Compute**
- ✅ Azure Functions (Serverless Backend)
- ✅ Azure App Service (Frontend Angular)
- ✅ Auto-scaling configurado

#### 2. **Base de Datos**
- ✅ Azure Cosmos DB (NoSQL) con 3 contenedores:
  - `users` - Usuarios del sistema
  - `bookings` - Reservas de vuelos
  - `flights-cache` - Cache de búsquedas (TTL 1h)
- ✅ Azure Cache for Redis (Cache de alto rendimiento)

#### 3. **Storage**
- ✅ Storage Account (Functions)
- ✅ Storage Account (Data) con contenedores:
  - `tickets` - Billetes generados
  - `documents` - Documentos adjuntos

#### 4. **Seguridad**
- ✅ Azure Key Vault para secretos
- ✅ Managed Identity configurada
- ✅ JWT authentication
- ✅ HTTPS everywhere

#### 5. **Monitoreo**
- ✅ Application Insights
- ✅ Log Analytics Workspace
- ✅ Alertas configurables

#### 6. **Networking** (Producción)
- ✅ Azure CDN para distribución global
- ✅ API Management gateway (opcional)
- ✅ CORS configurado

---

## 🚀 Despliegue Rápido

### Opción 1: Script Automático (Recomendado)

```bash
# 1. Configurar variables de entorno
export ARM_CLIENT_ID="your-client-id"
export ARM_CLIENT_SECRET="your-client-secret"
export ARM_TENANT_ID="your-tenant-id"
export ARM_SUBSCRIPTION_ID="your-subscription-id"
export AMADEUS_API_KEY="your-amadeus-key"
export AMADEUS_API_SECRET="your-amadeus-secret"

# 2. Ejecutar despliegue completo
./infrastructure/deploy.sh dev westeurope

# Para producción
./infrastructure/deploy.sh prod westeurope
```

### Opción 2: Manual (Paso a Paso)

Ver guía completa en: **[AZURE_REAL_DEPLOYMENT.md](AZURE_REAL_DEPLOYMENT.md)**

---

## 💰 Costos Estimados

### Desarrollo
- **€40-90/mes** - Incluye todo lo necesario para desarrollo y testing

### Producción
- **€330-600/mes** - Infraestructura completa con HA y escalabilidad

Ver desglose detallado en: **[AZURE_COSTS_BREAKDOWN.md](AZURE_COSTS_BREAKDOWN.md)**

---

## 🔌 Integraciones Reales

### 1. Amadeus Flight Search API
- ✅ Búsqueda real de vuelos
- ✅ Precios en tiempo real
- ✅ Disponibilidad de asientos
- ✅ Múltiples aerolíneas
- ✅ Cache inteligente (Redis + Cosmos)

**Registro**: https://developers.amadeus.com/

### 2. Azure Cosmos DB
- ✅ Base de datos NoSQL escalable
- ✅ Distribución global (multi-región)
- ✅ Consistency levels configurables
- ✅ Automatic indexing

### 3. Azure Redis Cache
- ✅ Cache de sesiones de usuario
- ✅ Cache de resultados de búsqueda
- ✅ Rate limiting
- ✅ High availability con replicación

---

## 📊 Monitoreo y Logging

### Application Insights
```bash
# Ver métricas en tiempo real
az monitor app-insights metrics show \
  --resource-group flyseats-dev-rg \
  --app flyseats-dev-insights \
  --metric "requests/count"

# Ver logs
az monitor app-insights query \
  --resource-group flyseats-dev-rg \
  --app flyseats-dev-insights \
  --analytics-query "requests | take 10"
```

### Logs en Vivo
```bash
# Backend logs
az webapp log tail --name flyseats-dev-functions --resource-group flyseats-dev-rg

# Frontend logs
az webapp log tail --name flyseats-dev-webapp --resource-group flyseats-dev-rg
```

---

## 🔐 Seguridad Implementada

### Azure Key Vault
- ✅ Credenciales de Amadeus API
- ✅ Connection strings
- ✅ JWT secret key
- ✅ Acceso vía Managed Identity

### Autenticación
- ✅ JWT tokens con expiración
- ✅ Password hashing (SHA256)
- ✅ Session management con Redis
- ✅ HTTPS obligatorio

### Network Security
- ✅ CORS configurado
- ✅ TLS 1.2 mínimo
- ✅ Firewall rules
- ✅ Private endpoints (opcional)

---

## 🔄 CI/CD con GitHub Actions

### Pipeline Configurado
1. ✅ Build y test del backend
2. ✅ Build y test del frontend
3. ✅ Deploy de infraestructura (Terraform)
4. ✅ Deploy del backend (Azure Functions)
5. ✅ Deploy del frontend (Web App)
6. ✅ Smoke tests automáticos
7. ✅ Notificaciones de deployment

### Configuración en GitHub

**Secrets necesarios:**
```
AZURE_CREDENTIALS
AZURE_SUBSCRIPTION_ID
AZURE_RESOURCE_GROUP
AZURE_FUNCTIONAPP_NAME
AZURE_WEBAPP_NAME
ARM_CLIENT_ID
ARM_CLIENT_SECRET
ARM_TENANT_ID
```

Ver workflow completo en: `.github/workflows/deploy-azure.yml`

---

## 📋 Checklist de Despliegue

- [ ] Cuenta de Azure creada y activa
- [ ] Azure CLI instalado
- [ ] Terraform instalado
- [ ] Credenciales de Amadeus obtenidas
- [ ] Variables de entorno configuradas
- [ ] Service Principal creado
- [ ] Script de despliegue ejecutado
- [ ] Secretos configurados en Key Vault
- [ ] Tests de integración pasados
- [ ] Monitoreo configurado
- [ ] CI/CD configurado en GitHub
- [ ] Documentación revisada

---

## 🆘 Soporte y Troubleshooting

### Problemas Comunes

#### Error: "Terraform init failed"
```bash
# Limpiar estado y reiniciar
rm -rf .terraform
terraform init
```

#### Error: "Failed to connect to Cosmos DB"
```bash
# Verificar firewall
az cosmosdb update \
  --resource-group $RESOURCE_GROUP \
  --name $COSMOS_NAME \
  --ip-range-filter "$(curl -s ifconfig.me)"
```

#### Error: "Amadeus API key not found"
```bash
# Verificar Key Vault access
az keyvault set-policy \
  --name $KEY_VAULT \
  --object-id $(az functionapp identity show \
    --resource-group $RESOURCE_GROUP \
    --name $FUNCTION_APP \
    --query principalId -o tsv) \
  --secret-permissions get list
```

Ver más en: **[AZURE_REAL_DEPLOYMENT.md](AZURE_REAL_DEPLOYMENT.md#troubleshooting)**

---

## 📚 Documentación

- **[AZURE_REAL_DEPLOYMENT.md](AZURE_REAL_DEPLOYMENT.md)** - Guía completa de despliegue
- **[AZURE_COSTS_BREAKDOWN.md](AZURE_COSTS_BREAKDOWN.md)** - Análisis de costos
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arquitectura del sistema
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guía de deployment original
- **[SECURITY.md](SECURITY.md)** - Políticas de seguridad

---

## 🎯 Próximos Pasos

### Después del Despliegue

1. **Verificar URLs**
   - Frontend: `https://flyseats-{env}-webapp.azurewebsites.net`
   - Backend: `https://flyseats-{env}-functions.azurewebsites.net`

2. **Configurar Dominio Personalizado** (Opcional)
   ```bash
   az webapp config hostname add \
     --resource-group $RESOURCE_GROUP \
     --webapp-name $WEB_APP \
     --hostname "www.tudominio.com"
   ```

3. **Configurar SSL Personalizado** (Opcional)
   ```bash
   az webapp config ssl bind \
     --resource-group $RESOURCE_GROUP \
     --name $WEB_APP \
     --certificate-thumbprint $THUMBPRINT \
     --ssl-type SNI
   ```

4. **Monitorear Costos**
   ```bash
   az consumption usage list \
     --start-date "2026-02-01" \
     --end-date "2026-02-28"
   ```

---

## 👥 Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guías de contribución.

---

## 📄 Licencia

Este proyecto es parte de un Trabajo de Fin de Máster (TFM).

---

## ✨ Features Implementadas

- ✅ Infraestructura completa en Azure
- ✅ Integración real con Amadeus API
- ✅ Base de datos NoSQL (Cosmos DB)
- ✅ Cache de alto rendimiento (Redis)
- ✅ Autenticación JWT
- ✅ Gestión de secretos (Key Vault)
- ✅ Monitoreo completo (Application Insights)
- ✅ CI/CD automatizado (GitHub Actions)
- ✅ Auto-scaling configurado
- ✅ Alta disponibilidad
- ✅ Backup automático
- ✅ SSL/TLS everywhere
- ✅ CORS configurado
- ✅ CDN global (producción)
- ✅ API Management (producción)

---

**🎉 Tu aplicación está lista para producción en Azure! 🎉**

Para comenzar, sigue la guía en **[AZURE_REAL_DEPLOYMENT.md](AZURE_REAL_DEPLOYMENT.md)**
