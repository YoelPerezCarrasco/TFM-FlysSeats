# Costos Detallados de Azure para FlysSeats

## 📊 Resumen de Costos por Entorno

### Desarrollo (dev)
- **Costo Total Mensual**: €40 - €90
- **Costo Anual**: €480 - €1,080

### Producción (prod)
- **Costo Total Mensual**: €330 - €600
- **Costo Anual**: €3,960 - €7,200

---

## 💰 Desglose Detallado por Servicio

### 1. Azure Functions (Backend API)

| Entorno | SKU | Incluido | Costo Extra | Total Mensual |
|---------|-----|----------|-------------|--------------|
| **Dev** | Consumption Y1 | 1M ejecuciones<br/>400,000 GB-s | €0.169/millón ejecuciones<br/>€0.000014/GB-s | €0 - €15 |
| **Prod** | Premium EP1 | ilimitado | 1 vCore<br/>3.5 GB RAM | **€145** |

**Recomendación Dev**: Consumo raramente excede el free tier
**Recomendación Prod**: EP1 para mejor rendimiento y VNet integration

---

### 2. App Service (Frontend Angular)

| Entorno | SKU | vCores | RAM | Storage | Total Mensual |
|---------|-----|--------|-----|---------|--------------|
| **Dev** | B1 Basic | 1 | 1.75 GB | 10 GB | **€14** |
| **Prod** | S1 Standard | 1 | 1.75 GB | 50 GB | **€70** |

**Features Prod**: 
- Auto-scaling
- Custom domains with SSL
- Deployment slots
- 99.95% SLA

---

### 3. Azure Cosmos DB (Base de Datos)

| Entorno | Modelo | RU/s | Storage | Total Mensual |
|---------|--------|------|---------|--------------|
| **Dev** | Serverless | On-demand | Pay-per-GB | €5 - €30 |
| **Prod** | Serverless | On-demand | Pay-per-GB | €30 - €200 |

**Cálculo de Costos**:
- **Request Units**: €0.25 por millón RUs
- **Storage**: €0.25 por GB
- **Backup**: Incluido (7 días)

**Estimación Dev** (100 users/día):
```
Lecturas: 10,000/día × 1 RU = 300,000 RUs/mes = €0.08
Escrituras: 1,000/día × 5 RUs = 150,000 RUs/mes = €0.04
Storage: 5 GB × €0.25 = €1.25
Total: ~€5/mes
```

**Estimación Prod** (10,000 users/día):
```
Lecturas: 1M/día × 1 RU = 30M RUs/mes = €7.50
Escrituras: 100k/día × 5 RUs = 15M RUs/mes = €3.75
Storage: 50 GB × €0.25 = €12.50
Total: ~€30-200/mes (con picos)
```

---

### 4. Azure Cache for Redis

| Entorno | SKU | Cache Size | Max Connections | Total Mensual |
|---------|-----|------------|----------------|--------------|
| **Dev** | Basic C0 | 250 MB | 256 | **€17** |
| **Prod** | Standard C1 | 1 GB | 1,000 | **€63** |

**Features Standard**:
- Replication para HA
- 99.99% SLA
- Persistent storage

---

### 5. Azure Storage Account

| Tipo | Entorno | Replication | Storage | Transactions | Total Mensual |
|------|---------|-------------|---------|--------------|--------------|
| **Functions** | Dev | LRS | 1 GB | 100k | €0.50 |
| **Functions** | Prod | GRS | 5 GB | 1M | €2 |
| **Data** | Dev | LRS | 5 GB | 10k | €1.50 |
| **Data** | Prod | GRS | 50 GB | 100k | €13 |

**Costos por GB** (LRS):
- Hot tier: €0.0184/GB
- Cool tier: €0.0100/GB
- Archive: €0.00099/GB

**Total Dev**: ~€2
**Total Prod**: ~€15

---

### 6. Azure Key Vault

| Operación | Costo | Dev Usage | Prod Usage |
|-----------|-------|-----------|------------|
| Secret operations | €0.03/10,000 ops | 1,000 ops | 10,000 ops |
| Certificate operations | €3.01/renewal | 0 | 0 |
| Key operations | €0.03/10,000 ops | 0 | 1,000 ops |

**Total Dev**: ~€0.01/mes
**Total Prod**: ~€0.10/mes

---

### 7. Application Insights & Log Analytics

| Componente | Free Allowance | Costo Extra | Dev | Prod |
|-----------|----------------|-------------|-----|------|
| Data Ingestion | 5 GB/mes | €2.30/GB | €0 - €5 | €10 - €50 |
| Data Retention | 90 días | €0.10/GB/mes | €0 | €2 - €10 |

**Estimación de Logs**:
- Dev: ~2 GB/mes (dentro del free tier)
- Prod: ~10-20 GB/mes

---

### 8. Azure CDN (Solo Producción)

| Tier | Zonas | Precio/GB | Estimado 100GB | Total Mensual |
|------|-------|-----------|----------------|--------------|
| Standard Microsoft | Zone 1 (Europa) | €0.081/GB | 100 GB | **€8** |

**Costos adicionales**:
- HTTP/HTTPS requests: €0.0072/10,000
- Estimado: 1M requests = €0.72

**Total con tráfico moderado**: €8-15/mes

---

### 9. Azure API Management (Solo Producción, Opcional)

| Tier | Calls Included | Extra Calls | Total Mensual |
|------|----------------|-------------|--------------|
| Consumption | - | €3.50/M calls | **€0 - €50** |

**Estimación**:
- 100k calls/mes: €0.35
- 1M calls/mes: €3.50
- 10M calls/mes: €35

---

## 📈 Escenarios de Uso Reales

### Escenario 1: Startup (0-1,000 usuarios/mes)

```
Entorno: Dev
Azure Functions: €5
App Service B1: €14
Cosmos DB: €10
Redis C0: €17
Storage: €2
Application Insights: €0
Total: €48/mes
```

### Escenario 2: Crecimiento (1,000-10,000 usuarios/mes)

```
Entorno: Prod (sin CDN/APIM)
Azure Functions EP1: €145
App Service S1: €70
Cosmos DB: €50
Redis C1: €63
Storage: €15
Application Insights: €20
Total: €363/mes
```

### Escenario 3: Producción Completa (10,000+ usuarios/mes)

```
Entorno: Prod (completo)
Azure Functions EP1: €145
App Service S1: €70
Cosmos DB: €150
Redis Standard C1: €63
Storage (GRS): €15
Application Insights: €40
CDN: €12
API Management: €20
Total: €515/mes
```

---

## 💡 Optimización de Costos

### 1. Reservas de Azure (Ahorrar 30-50%)

```bash
# Comprar reserva de 1 año para App Service
az reservations reservation-order purchase \
  --reserved-resource-type "VirtualMachines" \
  --sku-name "Standard_B1s" \
  --location "westeurope" \
  --term "P1Y"
```

**Ahorro estimado en Prod**: €100-150/mes

### 2. Auto-scaling Inteligente

**Dev**: Escalar a 0 fuera de horas de trabajo
```bash
# Detener App Service por la noche
az webapp stop --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP
```

**Ahorro Dev**: ~30% (€4/mes en App Service)

### 3. Cosmos DB con TTL

Configurar Time-To-Live para datos temporales:
```json
{
  "defaultTtl": 3600  // 1 hora para cache de vuelos
}
```

**Ahorro**: 20-40% en storage

### 4. Compresión y CDN Inteligente

- Habilitar Gzip compression
- Cache headers apropiados
- CDN solo para assets estáticos

**Ahorro**: 30-50% en bandwidth

### 5. Alertas de Presupuesto

```bash
# Crear alerta de presupuesto
az consumption budget create \
  --budget-name "flyseats-monthly-budget" \
  --amount 500 \
  --category "Cost" \
  --time-grain "Monthly" \
  --start-date "2026-01-01" \
  --end-date "2026-12-31"
```

---

## 🎯 Recomendaciones Finales

### Para Desarrollo/Testing
1. Usar Consumption tier para Functions (gratis)
2. B1 App Service (suficiente para dev)
3. Redis C0 Basic (suficiente para cache simple)
4. Cosmos DB Serverless (pagar solo lo que usas)
5. **Costo total**: ~€50/mes

### Para Producción Inicial (MVP)
1. Premium EP1 Functions (mejor rendimiento)
2. S1 App Service con auto-scaling
3. Redis Standard C1 (HA y replicación)
4. Cosmos DB Serverless (escalable)
5. CDN solo si >10k usuarios
6. **Costo total**: ~€360/mes

### Para Producción Escalada
1. Todas las opciones anteriores
2. Añadir CDN para distribución global
3. API Management para governance
4. Múltiples regiones (Geo-replication)
5. **Costo total**: ~€500-800/mes

---

## 📊 Comparación con Competidores

| Servicio | Azure (FlysSeats) | AWS Equivalente | GCP Equivalente |
|----------|------------------|-----------------|-----------------|
| Functions | €145/mes (EP1) | Lambda + API Gateway: €120/mes | Cloud Functions: €130/mes |
| App Service | €70/mes (S1) | Elastic Beanstalk: €65/mes | App Engine: €70/mes |
| Database | €50-150/mes | DynamoDB: €60-180/mes | Firestore: €55-170/mes |
| Cache | €63/mes | ElastiCache: €70/mes | Memorystore: €65/mes |
| CDN | €8/mes | CloudFront: €10/mes | Cloud CDN: €9/mes |
| **TOTAL** | **€336-456/mes** | **€325-445/mes** | **€329-444/mes** |

**Conclusión**: Precios muy similares en los 3 principales clouds.

---

## 🔍 Monitoreo de Costos en Tiempo Real

```bash
# Ver costos actuales
az consumption usage list \
  --start-date "2026-02-01" \
  --end-date "2026-02-28" \
  --query "[?contains(instanceName,'flyseats')].{Service:instanceName,Cost:pretaxCost}" \
  --output table

# Exportar a CSV para análisis
az consumption usage list \
  --start-date "2026-02-01" \
  --end-date "2026-02-28" \
  --output json > azure-costs-feb-2026.json
```

---

**Última actualización**: Febrero 2026
**Precios de Azure**: Región West Europe
**Moneda**: EUR (€)
