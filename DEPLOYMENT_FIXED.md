# ✅ Deployment Arreglado - FlysSeats

## 🎉 Estado Actual

El backend de Azure ahora está **funcionando correctamente**. El problema era que los archivos Python no se estaban desplegando en la ubicación correcta (`wwwroot`).

### Solución Implementada

Se utilizó `az webapp up` en lugar de `config-zip`, que:
1. Detecta automáticamente la aplicación Python
2. Crea el deployment package correctamente
3. Configura el runtime y startup command
4. Extrae los archivos en la ubicación correcta

También se actualizó el runtime de **Python 3.9** → **Python 3.11** (3.9 ya no está soportado).

---

## 🚀 URLs de la Aplicación

### Backend API (Azure)
- **URL**: https://flyseats2-dev-api.azurewebsites.net
- **Health Check**: https://flyseats2-dev-api.azurewebsites.net/api/health
- **Estado**: ✅ Funcionando
  ```json
  {
    "status": "healthy",
    "service": "FlysSeats API",
    "cosmos_db": "connected",
    "amadeus_api": "connected",
    "version": "1.0.0"
  }
  ```

### Frontend (Local)
- **URL**: http://localhost:4200
- **Estado**: ✅ Configurado para usar backend Azure
- **Archivo**: `flyseats-frontend/src/environments/environment.ts`

---

## 🔑 Credenciales de Prueba

### Usuario de Test
- **Email**: `test@flyseats.com`
- **Password**: `test123`
- **Nombre**: Usuario de Prueba
- **ID**: 859b25e0-4b9a-4245-8cc8-78f272f3cb0d

### Datos de Prueba en Cosmos DB
- ✅ **1 usuario** (test@flyseats.com)
- ✅ **1 vuelo** (IB8501: MAD → BCN, €89.99)
- ✅ **1 reserva** (Asiento 12A, confirmada)

---

## 🔧 Endpoints Disponibles

### Autenticación
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login (devuelve usuario + token)

### Vuelos
- `GET /api/flights/search` - Búsqueda de vuelos (Amadeus API)
  - Query params: `origin`, `destination`, `departureDate`, `adults`

### Reservas
- `GET /api/bookings` - Listar reservas del usuario
- `POST /api/bookings` - Crear nueva reserva
- `GET /api/bookings/{id}` - Obtener reserva específica

### Health
- `GET /api/health` - Estado del servicio

---

## 📝 Ejemplo de Uso

### 1. Login
```bash
curl -X POST https://flyseats2-dev-api.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@flyseats.com", "password": "test123"}'
```

**Respuesta**:
```json
{
  "message": "Login exitoso",
  "user": {
    "id": "859b25e0-4b9a-4245-8cc8-78f272f3cb0d",
    "email": "test@flyseats.com",
    "name": "Usuario de Prueba"
  }
}
```

### 2. Buscar Vuelos
```bash
curl "https://flyseats2-dev-api.azurewebsites.net/api/flights/search?origin=MAD&destination=BCN&departureDate=2024-12-01&adults=1"
```

### 3. Health Check
```bash
curl https://flyseats2-dev-api.azurewebsites.net/api/health
```

---

## 💻 Desarrollo Local

Si necesitas ejecutar el backend localmente (con las bases de datos de Azure):

```bash
# Terminal 1 - Backend local con Azure Cosmos DB
cd ~/TFM/TFM-FlysSeats/backend
./run_local.sh

# Terminal 2 - Frontend
cd ~/TFM/TFM-FlysSeats/flyseats-frontend
# Cambiar en environment.ts: apiUrl: 'http://localhost:5000/api'
npm start
```

---

## 🏗️ Infraestructura Azure

### Resource Group
- **Nombre**: `flyseats2-dev-rg`
- **Región**: Germany West Central

### Recursos Desplegados
1. **App Service Plan**: flyseats2-dev-plan (F1 Free)
2. **App Service**: flyseats2-dev-api (Python 3.11)
3. **Cosmos DB**: flyseats2-dev-cosmos (Serverless)
   - Containers: `users`, `flights`, `bookings`
4. **Storage Account**: flyseats2devdata
5. **Key Vault**: flyseats2-dev-kv (Amadeus credentials)
6. **Application Insights**: flyseats2-dev-insights

### Costos Estimados
- App Service F1: **€0** (free tier)
- Cosmos DB Serverless: **~€5-10/mes**
- Storage Account: **~€0.50/mes**
- Key Vault: **€0** (free tier para este volumen)
- **Total**: **€5-11/mes**

---

## 🔐 Seguridad

⚠️ **IMPORTANTE**: El sistema actual usa **contraseñas en texto plano** para simplificar el TFM.

**Para producción**, deberías:
1. Implementar bcrypt o argon2 para hash de passwords
2. Usar JWT tokens con expiración
3. Implementar rate limiting
4. Añadir HTTPS obligatorio
5. Validar todos los inputs
6. Implementar RBAC (roles)

---

## 📊 Próximos Pasos

1. **Probar el Login**: Abre http://localhost:4200 y usa `test@flyseats.com` / `test123`
2. **Buscar Vuelos**: Prueba la funcionalidad de búsqueda
3. **Crear Reservas**: Intenta hacer una reserva de vuelo
4. **Verificar Datos**: Comprueba que se guardan en Cosmos DB

---

## 🐛 Troubleshooting

### Backend devuelve 404
```bash
# Redeployar con az webapp up
cd ~/TFM/TFM-FlysSeats/backend
az webapp up --resource-group flyseats2-dev-rg --name flyseats2-dev-api --runtime "PYTHON:3.11" --sku F1
```

### Frontend no conecta con Backend
```bash
# Verificar environment.ts
cat flyseats-frontend/src/environments/environment.ts
# Debe tener: apiUrl: 'https://flyseats2-dev-api.azurewebsites.net/api'

# Reiniciar frontend
pkill -f "ng serve"
cd flyseats-frontend && npm start
```

### Ver logs de Azure
```bash
# Descargar logs
az webapp log download --resource-group flyseats2-dev-rg --name flyseats2-dev-api --log-file ~/webapp-logs.zip

# Streaming (tail)
az webapp log tail --resource-group flyseats2-dev-rg --name flyseats2-dev-api
```

---

## ✅ Checklist de Verificación

- [x] Backend desplegado en Azure
- [x] Health endpoint respondiendo
- [x] Cosmos DB accesible
- [x] Amadeus API conectada
- [x] Login funcionando
- [x] Datos de prueba insertados
- [x] Frontend configurado con backend Azure
- [x] Frontend iniciado en localhost:4200
- [ ] Login probado desde UI
- [ ] Búsqueda de vuelos probada
- [ ] Reservas probadas
- [ ] Documentación del TFM actualizada

---

**Fecha**: 16 de Febrero, 2026  
**Estado**: ✅ Arreglado y Funcionando  
**Deployment Method**: `az webapp up` (Python 3.11)
