# 🎓 FlysSeats TFM - Configuración Económica

## 💰 Configuración Optimizada para TFM

Esta configuración está diseñada para **minimizar costos** al máximo, perfecta para:
- Trabajos Fin de Máster (TFM)
- Trabajos Fin de Grado (TFG)
- Proyectos académicos
- Demos y pruebas de concepto

## 📊 Costos Reales

### Con Azure for Students ($100 crédito)

| Servicio | Tier | Costo/Mes | Estado |
|----------|------|-----------|--------|
| **Cosmos DB** | Free Tier | **€0** | ✅ GRATIS para siempre |
| **Azure Functions** | Consumption | **€0-2** | ✅ 1M ejecuciones gratis |
| **App Service** | F1 Free | **€0** | ✅ GRATIS |
| **Storage** | Standard | **€0-1** | ✅ Primeros 5GB gratis |
| **Key Vault** | Standard | **€0** | ✅ Casi gratis |
| **App Insights** | Basic | **€0-2** | ✅ 5GB gratis |
| **Redis** | - | **€0** | ⚡ DESHABILITADO |
| **TOTAL** | | **€0-5/mes** | 🎉 |

**⏱️ Con $100 USD:** Todo tu TFM + sobra crédito para otros proyectos

## 🚀 Despliegue Rápido

```bash
# 1. Cargar variables
source .env

# 2. Desplegar con configuración TFM
cd infrastructure/terraform
terraform init
terraform plan -var-file="tfm.tfvars"
terraform apply -var-file="tfm.tfvars"

# O usar el script:
cd ~/TFM/TFM-FlysSeats
./infrastructure/deploy.sh dev westeurope
```

## ✨ Características

### ✅ Lo que SÍ tienes (GRATIS)

- ✅ **Cosmos DB con Free Tier**
  - 1000 RU/s gratis para siempre
  - 25 GB storage gratis
  - Suficiente para miles de usuarios en demo

- ✅ **Azure Functions (Serverless)**
  - Backend API completo
  - 1 millón de ejecuciones gratis/mes
  - Escala automáticamente

- ✅ **App Service Free F1**
  - Frontend Angular desplegado
  - 1 GB RAM
  - 60 minutos CPU/día
  - Suficiente para demos

- ✅ **Amadeus API (Test)**
  - Búsqueda de vuelos real
  - API ilimitada en modo test
  - 100% gratis

- ✅ **Application Insights**
  - Monitoreo completo
  - 5 GB logs gratis/mes
  - Dashboards y métricas

### ⚡ Lo que NO tienes (para ahorrar)

- ❌ **Redis Cache**
  - Ahorras: ~€17/mes
  - Alternativa: Cosmos DB cache (incluido)

- ❌ **CDN**
  - Solo necesario para producción global
  - Ahorras: ~€8/mes

- ❌ **API Management**
  - Solo para producción enterprise
  - Ahorras: ~€35/mes

**Total ahorrado: ~€60/mes** 🎉

## 🔄 Comparación: TFM vs Producción

| Característica | TFM (Gratis) | Producción (€500/mes) |
|----------------|--------------|----------------------|
| Base de datos | Cosmos DB Free | Cosmos DB Premium |
| Cache | Cosmos DB | Redis Premium |
| Frontend | App Service F1 | App Service S1 + CDN |
| Backend | Functions Consumption | Functions Premium |
| Región | 1 región | Multi-región |
| SLA | - | 99.95% |
| **Funcionalidad** | **100% igual** | 100% igual |

## 📝 Limitaciones del Free Tier

### App Service F1 (Free)

- ⏰ **60 min CPU/día**: Reinicia a las 00:00 UTC
- 💤 **Auto-sleep**: Inactivo >20 min
- 🔄 **Sin Always On**: Primera carga lenta (~10-20s)
- 📊 **1 GB RAM**: Suficiente para Angular

**💡 Solución:** Primera vez que abres la app tarda 10-20 segundos. Luego va rápido.

### Cosmos DB Free Tier

- 📊 **1000 RU/s**: ~50 requests/segundo
- 💾 **25 GB storage**: Miles de reservas
- 🌍 **1 región**: Solo westeurope

**💡 Suficiente para:** Demos, TFM, hasta 1000 usuarios de prueba

### Azure Functions

- ⚡ **1M ejecuciones/mes gratis**: ~30k por día
- ⏱️ **Timeout 5 min**: Más que suficiente

## 🎯 Casos de Uso Perfectos

✅ **SÍ usar esta configuración para:**
- Trabajos Fin de Máster/Grado
- Presentaciones y demos
- Prototipos y POCs
- Desarrollo y testing
- Portafolio personal

❌ **NO usar para:**
- Aplicaciones en producción real
- Apps con tráfico alto (>1000 users/día)
- SLAs garantizados
- Datos sensibles de producción

## 🔧 Mantenimiento

### Ver consumo de recursos

```bash
# Ver uso de Cosmos DB
az cosmosdb sql database throughput show \
  --account-name flyseats-dev-cosmos \
  --resource-group flyseats-dev-rg \
  --name flyseats-db

# Ver uso de Functions
az monitor metrics list \
  --resource flyseats-dev-functions \
  --metric FunctionExecutionCount
```

### Apagar cuando no uses (opcional)

```bash
# Detener App Service (frontend)
az webapp stop --name flyseats-dev-app --resource-group flyseats-dev-rg

# Iniciar de nuevo
az webapp start --name flyseats-dev-app --resource-group flyseats-dev-rg
```

## 🆘 Troubleshooting

### "App muy lenta al inicio"
**Causa:** Free tier hace cold start (auto-sleep)
**Solución:** Normal, espera 10-20s. Luego va rápido.

### "Quota exceeded"
**Causa:** Azure for Students tiene límites
**Solución:** Ya estás en la config más económica posible

### "Redis connection failed"
**Causa:** Redis deshabilitado en TFM mode
**Solución:** Normal, usa Cosmos DB cache (gratis)

## 📚 Más Información

- [AZURE_REAL_DEPLOYMENT.md](../AZURE_REAL_DEPLOYMENT.md) - Guía completa
- [AZURE_COSTS_BREAKDOWN.md](../AZURE_COSTS_BREAKDOWN.md) - Análisis de costos
- [QUICKSTART.md](../QUICKSTART.md) - Inicio rápido

---

**🎓 Hecho para TFMs - Funcionalidad 100%, Costo ~€0**
