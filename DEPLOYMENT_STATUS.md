# 🚀 Estado del Deployment - FlysSeats TFM

**Última Actualización**: 16 de Febrero, 2026 - ✅ **ARREGLADO Y FUNCIONANDO**

## ✅ Infraestructura Desplegada en Azure

### Recursos en Producción (Germany West Central)
- **Resource Group**: `flyseats2-dev-rg`
- **Backend API**: https://flyseats2-dev-api.azurewebsites.net ✅
- **Estado**: **Operacional** - Deployment arreglado con `az webapp up`
- **Frontend**: http://localhost:4200 (desarrollo local)

### Servicios Azure Activos
1. **Azure Cosmos DB** (`flyseats2-dev-cosmos`)
   - Modo: Serverless
   - Base de datos: `flyseats2-db`
   - Contenedores: users, flights, bookings
   - Estado: ✅ Connected

2. **Azure App Service** (`flyseats2-dev-api`)
   - Plan: F1 (Free tier)
   - Runtime: **Python 3.11** + Flask + Gunicorn
   - Status: ✅ Running
   - Health: https://flyseats2-dev-api.azurewebsites.net/api/health
   - Startup: `gunicorn --bind=0.0.0.0:8000 --timeout 600 app:app`

3. **Azure Storage Account** (`flyseats2devdata`)
   - Containers: documents, tickets
   - Purpose: Almacenamiento de documentos y billetes PDF

4. **Azure Key Vault** (`flyseats2-dev-kv`)
   - Secrets: Credenciales Amadeus API (Key + Secret)
   - Access: Managed Identity desde Backend

5. **Application Insights** (`flyseats2-dev-insights`)
   - Monitorización y logs de aplicación
   - Log Analytics Workspace integrado

## 🔑 Endpoints de la API

### Health Check
```bash
curl https://flyseats2-dev-api.azurewebsites.net/api/health
```
**Response:**
```json
{
  "status": "healthy",
  "service": "FlysSeats API",
  "version": "1.0.0",
  "cosmos_db": "connected",
  "amadeus_api": "connected"
}
```

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Login usuario

### Vuelos
- `GET /api/flights/search` - Buscar vuelos (Amadeus API)

### Reservas
- `POST /api/bookings` - Crear reserva
- `GET /api/bookings/<user_id>` - Obtener reservas de usuario

## 🖥️ Ejecución Local del Frontend

### Prerrequisitos
```bash
cd ~/TFM/TFM-FlysSeats/flyseats-frontend
npm install
```

### Iniciar Servidor de Desarrollo
```bash
npm start
# o
ng serve
```

La aplicación estará disponible en: **http://localhost:4200**

### Configuración
El frontend está configurado para conectarse al backend en Azure:
- **API URL**: `https://flyseats2-dev-api.azurewebsites.net/api`
- **Archivo**: `src/environments/environment.ts`

## 💰 Costos Estimados

### Recursos Actuales
- **App Service Plan (F1)**: €0/mes (Free tier)
- **Cosmos DB Serverless**: ~€5-10/mes (basado en uso)
- **Storage Account**: ~€0.01/mes (muy bajo uso)
- **Key Vault**: €0/mes (incluido en subscripción)
- **Application Insights**: €0/mes (bajo free tier)

**Total Estimado**: €5-10/mes

### Créditos Azure for Students
- Crédito inicial: $100 USD
- Validez: 12 meses
- Consumo actual: Muy bajo (~€5-10/mes = $5-11/mes)
- **Duración estimada**: 9-10 meses con recursos actuales

## 🔄 Comandos de Gestión

### Ver estado de la infraestructura
```bash
cd infrastructure/terraform
terraform show
```

### Ver outputs (URLs, nombres de recursos)
```bash
terraform output
```

### Ver logs del backend
```bash
az webapp log tail --resource-group flyseats2-dev-rg --name flyseats2-dev-api
```

### Redesplegar backend (tras cambios)
```bash
cd backend
python3 << 'EOF'
import zipfile, os
with zipfile.ZipFile('../backend.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in {'__pycache__', '.git', 'venv'}]
        for file in files:
            if not any(pat in file for pat in {'.pyc', '.git'}):
                filepath = os.path.join(root, file)
                zipf.write(filepath, os.path.relpath(filepath, '.'))
EOF

cd ..
az webapp deployment source config-zip \
  --resource-group flyseats2-dev-rg \
  --name flyseats2-dev-api \
  --src backend.zip
```

## 📊 Arquitectura Implementada

```
┌─────────────────────┐
│   Frontend Local    │
│   Angular + TS      │ http://localhost:4200
│   (Desarrollo)      │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────────────────────────────────┐
│           AZURE CLOUD INFRASTRUCTURE            │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │   Backend API (App Service F1)          │  │
│  │   Flask + Gunicorn + Python 3.9         │  │
│  │   flyseats2-dev-api.azurewebsites.net   │  │
│  └───┬──────────────────────────────────┬──┘  │
│      │                                  │      │
│      ▼                                  ▼      │
│  ┌─────────────────┐         ┌───────────────┐│
│  │  Azure Cosmos   │         │  Key Vault    ││
│  │  DB Serverless  │         │  (Amadeus)    ││
│  │  NoSQL          │         │  Secrets      ││
│  └─────────────────┘         └───────────────┘│
│      │                                         │
│      ▼                                         │
│  ┌─────────────────┐         ┌───────────────┐│
│  │  Storage Acct   │         │  App Insights ││
│  │  (Blob/Files)   │         │  + Logs       ││
│  └─────────────────┘         └───────────────┘│
│                                                 │
└─────────────────────────────────────────────────┘
           │ API Calls
           ▼
┌─────────────────────┐
│   Amadeus API       │
│   (External)        │
└─────────────────────┘
```

## 🔐 Seguridad

### Credenciales Protegidas
- ✅ Amadeus API Key/Secret en Azure Key Vault
- ✅ Managed Service Identity para acceso a Key Vault
- ✅ Connection strings de Cosmos DB en App Settings (cifradas)
- ✅ HTTPS enforced en todos los endpoints
- ✅ CORS configurado en backend

### Variables de Entorno Sensibles
**NUNCA subir a Git:**
- `.env` (raíz del proyecto)
- `terraform.tfstate` (estado de Terraform)
- Credenciales de Service Principal

## 📝 Notas para el TFM

### Aspectos a Destacar
1. **Infraestructura como Código**: Todo gestionado con Terraform
2. **Cloud-Native**: Servicios PaaS de Azure (sin servidores que gestionar)
3. **Serverless Database**: Cosmos DB en modo serverless (pago por uso)
4. **Seguridad**: Key Vault + Managed Identity (sin credenciales en código)
5. **Monitorización**: Application Insights para logs y métricas

### Posibles Mejoras Futuras
- Migrar frontend a Azure Static Web Apps (cuando esté disponible en región)
- Implementar CI/CD con GitHub Actions
- Añadir Redis Cache para optimizar performance
- Implementar Azure CDN para assets estáticos
- Configurar custom domain con SSL

## 🎯 Testing de la Aplicación

### 1. Backend Health Check
```bash
curl https://flyseats2-dev-api.azurewebsites.net/api/health
```

### 2. Frontend Local
1. Abrir navegador: http://localhost:4200
2. Verificar que carga la página de login
3. Probar registro de usuario
4. Probar búsqueda de vuelos

### 3. Integración Amadeus
El backend está conectado a la API real de Amadeus y puede hacer búsquedas reales de vuelos.

## 📄 Documentación Relacionada

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura completa del sistema
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Resumen del proyecto
- [SECURITY.md](./SECURITY.md) - Consideraciones de seguridad

---

**Última actualización**: 16 Febrero 2026  
**Estado**: ✅ Operational  
**Region**: Germany West Central  
**Subscription**: Azure for Students
