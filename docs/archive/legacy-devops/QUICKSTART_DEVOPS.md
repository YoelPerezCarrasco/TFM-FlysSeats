# ⚡ Guía Rápida: Azure DevOps CI/CD

## 🚨 Problema: Authentication failed

Si viste este error al clonar desde Azure DevOps:
```
fatal: Authentication failed for 'https://dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats/'
```

## ✅ Solución Rápida (5 minutos)

### 1️⃣ Crear Personal Access Token (PAT)

1. Ve a: https://dev.azure.com/flyseats/_usersSettings/tokens
2. Click **+ New Token**
3. Configura:
   - **Name**: `TFM-FlysSeats-PAT`
   - **Expiration**: 90 días
   - **Scopes**: **Code** (Read, write, & manage)
4. **Copia el token** (solo se muestra una vez)

### 2️⃣ Ejecutar Script Automático

```bash
cd ~/TFM/TFM-FlysSeats
./scripts/setup-azure-devops-remote.sh
```

El script te guiará para:
- ✅ Agregar Azure DevOps como remote
- ✅ Verificar la conexión
- ✅ Hacer push inicial (opcional)

### 3️⃣ Método Manual (alternativa)

```bash
cd ~/TFM/TFM-FlysSeats

# Reemplaza <TU_PAT> con el token que copiaste
git remote add azuredevops https://<TU_PAT>@dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats

# Verificar
git remote -v

# Push inicial
git push azuredevops main --force
```

---

## 🔄 Workflow Diario

```bash
# 1. Hacer cambios
git add .
git commit -m "feat: Nueva funcionalidad"

# 2. Push a GitHub (opcional)
git push origin main

# 3. Push a Azure DevOps (activa el pipeline)
git push azuredevops main
```

---

## 📚 Documentación Completa

- **[AZURE_DEVOPS_AUTH.md](AZURE_DEVOPS_AUTH.md)** - Guía completa de autenticación
- **[DEVOPS_SETUP.md](DEVOPS_SETUP.md)** - Configuración de pipelines CI/CD
- **[DEPLOYMENT_FIXED.md](DEPLOYMENT_FIXED.md)** - Estado del deployment

---

## 🎯 Próximos Pasos

1. **Configurar Service Connection**
   - Project Settings → Service connections
   - New service connection → Azure Resource Manager
   - Name: `Azure-ServiceConnection`

2. **Crear Variable Group**
   - Pipelines → Library → + Variable group
   - Name: `FlysSeats-Backend-Config`
   - Ejecutar: `./scripts/get-azure-config.sh` para obtener valores

3. **Crear Pipeline**
   - Pipelines → New pipeline
   - Existing YAML file: `/azure-pipelines-backend.yml`

---

## 🔧 Scripts Disponibles

```bash
# Obtener configuración de Azure para Variable Groups
./scripts/get-azure-config.sh

# Configurar Azure DevOps como remote
./scripts/setup-azure-devops-remote.sh

# Ejecutar backend localmente (con Azure DB)
cd backend && ./run_local.sh

# Administrar base de datos
cd backend && ./manage_db.sh
```

---

## 🚨 Troubleshooting

### Error: Authentication failed
→ El PAT expiró o es inválido. Crear nuevo PAT y actualizar:
```bash
git remote set-url azuredevops https://<NUEVO_PAT>@dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats
```

### Error: remote azuredevops already exists
→ Eliminar y recrear:
```bash
git remote remove azuredevops
./scripts/setup-azure-devops-remote.sh
```

### Pipeline no se ejecuta automáticamente
→ Verificar triggers en `azure-pipelines-backend.yml`:
```yaml
trigger:
  branches:
    include:
      - main
```

---

## 📊 Estado Actual

✅ **Backend API**: https://flyseats2-dev-api.azurewebsites.net  
✅ **Health Check**: Funcionando  
✅ **Login**: test@flyseats.com / test123  
✅ **Infraestructura**: 18 recursos en Azure (Germany West Central)  

**Costo**: ~€5-10/mes (Cosmos DB Serverless)
