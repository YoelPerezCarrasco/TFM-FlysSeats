# 🚀 Configuración de Azure DevOps para FlysSeats

## Guía Completa de CI/CD con Azure DevOps

### 📋 Requisitos Previos

- ✅ Proyecto de Azure DevOps creado
- ✅ Repositorio importado desde GitHub
- ✅ Suscripción de Azure con credenciales activas
- ✅ Recursos de Azure ya desplegados (o usar pipeline de infraestructura)

---

## 🔧 Paso 1: Configurar Service Connection

### 1.1 Crear Azure Service Connection

1. **En Azure DevOps**:
   - Ve a **Project Settings** (esquina inferior izquierda)
   - Selecciona **Service connections**
   - Click en **New service connection**
   - Selecciona **Azure Resource Manager**
   - Click **Next**

2. **Método de autenticación**:
   - Selecciona **Service principal (automatic)**
   - Scope level: **Subscription**
   - Subscription: Selecciona tu Azure for Students
   - Resource group: `flyseats2-dev-rg` (o déjalo en blanco)

3. **Detalles**:
   - Service connection name: `Azure-ServiceConnection`
   - Description: `Connection to Azure for FlysSeats deployment`
   - ✅ Grant access permission to all pipelines
   - Click **Save**

### 1.2 Verificar Permisos

Asegúrate de que el Service Principal tenga los permisos necesarios:

```bash
# Obtener el ID del Service Principal (estará en la Service Connection)
# En Azure Portal → Azure Active Directory → App registrations

# Asignar permisos (si es necesario)
az role assignment create \
  --assignee <SERVICE_PRINCIPAL_ID> \
  --role Contributor \
  --scope /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/flyseats2-dev-rg
```

---

## 🏗️ Paso 2: Configurar Variables y Secrets

### 2.1 Crear Variable Group

1. **En Azure DevOps**:
   - Ve a **Pipelines** → **Library**
   - Click **+ Variable group**
   - Name: `FlysSeats-Backend-Config`

2. **Agregar Variables**:

   | Variable Name | Value | Secret? |
   |--------------|-------|---------|
   | `COSMOS_ENDPOINT` | https://flyseats2-dev-cosmos.documents.azure.com:443/ | No |
   | `COSMOS_KEY` | (tu key de Cosmos DB) | ✅ Yes |
   | `COSMOS_DATABASE` | flyseats2-db | No |
   | `AMADEUS_API_KEY` | (tu Amadeus key) | ✅ Yes |
   | `AMADEUS_API_SECRET` | (tu Amadeus secret) | ✅ Yes |
   | `KEY_VAULT_URL` | https://flyseats2-dev-kv.vault.azure.net/ | No |

3. **Guardar** y marcar **Allow access to all pipelines**

### 2.2 Obtener Valores desde Azure

```bash
# Cosmos DB Endpoint y Key
az cosmosdb show --name flyseats2-dev-cosmos --resource-group flyseats2-dev-rg --query documentEndpoint -o tsv
az cosmosdb keys list --name flyseats2-dev-cosmos --resource-group flyseats2-dev-rg --query primaryMasterKey -o tsv

# Key Vault (obtener secrets)
az keyvault secret show --vault-name flyseats2-dev-kv --name amadeus-api-key --query value -o tsv
az keyvault secret show --vault-name flyseats2-dev-kv --name amadeus-api-secret --query value -o tsv
```

---

## 📦 Paso 3: Crear Pipelines

### 3.1 Pipeline de Backend (Principal)

1. **En Azure DevOps**:
   - Ve a **Pipelines** → **Pipelines**
   - Click **New pipeline**
   - Selecciona **Azure Repos Git** (o tu source)
   - Selecciona tu repositorio
   - Selecciona **Existing Azure Pipelines YAML file**
   - Path: `/azure-pipelines-backend.yml`
   - Click **Continue**

2. **Configurar Variables**:
   - Click en **Variables** (esquina superior derecha)
   - Link variable group: `FlysSeats-Backend-Config`
   - Verificar que `azureSubscription: 'Azure-ServiceConnection'` coincida

3. **Ejecutar**:
   - Click **Run**
   - La primera vez te pedirá permisos para acceder al Service Connection
   - Click **Permit** y **Permit** de nuevo

### 3.2 Pipeline de Frontend (Opcional)

Repite el proceso para `azure-pipelines-frontend.yml`:

1. **New pipeline** → Existing YAML file
2. Path: `/azure-pipelines-frontend.yml`
3. **Run**

### 3.3 Pipeline de Infraestructura (Terraform)

**Solo si quieres automatizar Terraform**:

1. **New pipeline** → Existing YAML file
2. Path: `/azure-pipelines-infrastructure.yml`
3. Crear **Environment** llamado `production-infrastructure`
4. **Run**

---

## 🔄 Paso 4: Configurar Triggers y Environments

### 4.1 Crear Environments

Los environments permiten aprobar deployments manualmente:

1. **En Azure DevOps**:
   - Ve a **Pipelines** → **Environments**
   - Click **New environment**
   - Name: `production`
   - Description: `Production environment for FlysSeats`
   - Resource: None (or select App Service si quieres)

2. **Configurar Approvals** (opcional):
   - Dentro del environment → **⋮** (menú) → **Approvals and checks**
   - Click **Approvals**
   - Agregar usuarios que deben aprobar
   - Save

### 4.2 Branch Policies

Proteger la rama main:

1. **Repos** → **Branches**
2. Click **⋮** en `main` → **Branch policies**
3. Configurar:
   - ✅ Require a minimum number of reviewers: 1
   - ✅ Check for linked work items
   - ✅ Build validation: Agregar tu pipeline

---

## 🎯 Paso 5: Configurar App Settings en App Service

Las variables de entorno se pueden configurar automáticamente:

### Opción A: Desde el Pipeline (Recomendado)

El pipeline ya incluye `AzureAppServiceSettings@1` que configura las variables.

### Opción B: Manualmente en Azure Portal

```bash
# O vía CLI
az webapp config appsettings set \
  --resource-group flyseats2-dev-rg \
  --name flyseats2-dev-api \
  --settings \
    COSMOS_ENDPOINT="https://flyseats2-dev-cosmos.documents.azure.com:443/" \
    COSMOS_KEY="@Microsoft.KeyVault(SecretUri=https://flyseats2-dev-kv.vault.azure.net/secrets/cosmos-key/)" \
    COSMOS_DATABASE="flyseats2-db" \
    KEY_VAULT_URL="https://flyseats2-dev-kv.vault.azure.net/"
```

### Opción C: Usar Key Vault References (Más Seguro)

En el App Service, referencia los secrets desde Key Vault:

```
COSMOS_KEY = @Microsoft.KeyVault(SecretUri=https://flyseats2-dev-kv.vault.azure.net/secrets/cosmos-key/)
AMADEUS_API_KEY = @Microsoft.KeyVault(SecretUri=https://flyseats2-dev-kv.vault.azure.net/secrets/amadeus-api-key/)
```

El App Service necesita **Managed Identity** habilitado y permisos en Key Vault (ya lo tienes configurado).

---

## 🧪 Paso 6: Probar el Pipeline

### 6.1 Primer Deployment

1. **Hacer un cambio pequeño**:
   ```bash
   cd ~/TFM/TFM-FlysSeats
   
   # Modificar algo en backend/app.py (ej: cambiar versión)
   echo "# Pipeline test" >> backend/README.md
   
   git add .
   git commit -m "test: Trigger Azure Pipeline"
   git push origin main
   ```

2. **Ver el Pipeline en Acción**:
   - Ve a **Pipelines** → **Pipelines**
   - Click en el pipeline que se está ejecutando
   - Ver logs en tiempo real

### 6.2 Verificar Deployment

```bash
# Esperar ~3-5 minutos después del deployment
curl https://flyseats2-dev-api.azurewebsites.net/api/health

# Debería devolver:
# {"status":"healthy","service":"FlysSeats API","version":"1.0.0"}
```

---

## 📊 Paso 7: Configurar Monitoring (Opcional)

### 7.1 Ver Logs del Pipeline

En cada run del pipeline:
- **Jobs** → Ver cada step
- **Tests** tab → Resultados de tests (si los agregas)
- **Extensions** → Application Insights

### 7.2 Application Insights desde DevOps

Puedes crear dashboards que muestren:
- Deployment frequency
- Success rate
- Time to deploy
- API health metrics

---

## 🔐 Mejores Prácticas de Seguridad

### 1. Nunca comitees secrets en el código
```bash
# Verifica que .env esté en .gitignore
cat .gitignore | grep .env
```

### 2. Usa Key Vault References
```yaml
# En el pipeline, referencia Key Vault:
- task: AzureKeyVault@2
  inputs:
    azureSubscription: '$(azureSubscription)'
    KeyVaultName: 'flyseats2-dev-kv'
    SecretsFilter: '*'
    RunAsPreJob: true
```

### 3. Limita permisos del Service Principal
```bash
# Solo permisos necesarios en el Resource Group
az role assignment create \
  --role "Website Contributor" \
  --scope /subscriptions/.../resourceGroups/flyseats2-dev-rg
```

---

## 🚀 Flujo de Trabajo Completo

### Desarrollo Normal

```bash
# 1. Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar y commitear
git add .
git commit -m "feat: Nueva funcionalidad X"

# 3. Push a Azure DevOps
git push origin feature/nueva-funcionalidad

# 4. Crear Pull Request en Azure DevOps
# - El pipeline se ejecuta automáticamente (CI)
# - Review de código
# - Merge a main

# 5. Al hacer merge a main:
# - Pipeline ejecuta Build + Deploy (CD)
# - Si hay environment con approvals, espera aprobación
# - Deploy a Azure App Service
```

---

## 📝 Estructura de Archivos para DevOps

```
TFM-FlysSeats/
├── azure-pipelines-backend.yml        # ← Pipeline principal (Backend)
├── azure-pipelines-frontend.yml       # ← Pipeline frontend
├── azure-pipelines-infrastructure.yml # ← Pipeline Terraform (opcional)
├── DEVOPS_SETUP.md                   # ← Esta guía
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── ...
├── flyseats-frontend/
│   ├── package.json
│   └── ...
└── infrastructure/
    └── terraform/
```

---

## 🎯 Checklist de Setup

### Configuración Inicial
- [ ] Service Connection creado (`Azure-ServiceConnection`)
- [ ] Variable Group creado (`FlysSeats-Backend-Config`)
- [ ] Secrets configurados (Cosmos, Amadeus)
- [ ] Environment `production` creado

### Pipelines
- [ ] Pipeline de Backend configurado
- [ ] Pipeline ejecutado con éxito
- [ ] Backend deployado en Azure App Service
- [ ] Health check funcionando

### Seguridad
- [ ] Secrets almacenados en Key Vault o Variable Groups
- [ ] .env en .gitignore
- [ ] Service Principal con permisos mínimos
- [ ] Branch policies en main

### Testing
- [ ] Commit de prueba ejecutado
- [ ] Pipeline triggered automáticamente
- [ ] Logs revisados
- [ ] API verificada post-deployment

---

## 🔧 Comandos Útiles

### Ver información del Service Connection
```bash
az ad sp list --display-name "FlysSeats" --query "[].{Name:displayName, AppId:appId}" -o table
```

### Verificar App Service deployment
```bash
az webapp deployment list-publishing-profiles \
  --name flyseats2-dev-api \
  --resource-group flyseats2-dev-rg \
  --query "[?publishMethod=='MSDeploy'].publishUrl" -o tsv
```

### Logs en tiempo real
```bash
az webapp log tail --name flyseats2-dev-api --resource-group flyseats2-dev-rg
```

### Restart App Service desde CLI
```bash
az webapp restart --name flyseats2-dev-api --resource-group flyseats2-dev-rg
```

---

## 📚 Recursos Adicionales

- [Azure DevOps Pipelines Docs](https://docs.microsoft.com/azure/devops/pipelines)
- [Azure App Service Deployment](https://docs.microsoft.com/azure/app-service/deploy-continuous-deployment)
- [Terraform in Azure DevOps](https://docs.microsoft.com/azure/devops/pipelines/tasks/deploy/terraform)

---

## ❓ Troubleshooting

### Error: "Service connection not found"
**Solución**: Verifica que el nombre en el YAML (`azureSubscription: 'Azure-ServiceConnection'`) coincida exactamente con el nombre de tu Service Connection.

### Error: "Permission denied" en deployment
**Solución**: Asegúrate de que el Service Principal tenga rol `Contributor` o `Website Contributor` en el Resource Group.

### Pipeline no se ejecuta automáticamente
**Solución**: Verifica los triggers en el YAML:
```yaml
trigger:
  branches:
    include:
      - main
```

### Variables de entorno no disponibles en App Service
**Solución**: Configurarlas manualmente o usar el task `AzureAppServiceSettings@1` en el pipeline.

---

**¡Listo!** 🎉 

Ahora tienes CI/CD completo. Cada push a `main` desplegará automáticamente tu backend a Azure.
