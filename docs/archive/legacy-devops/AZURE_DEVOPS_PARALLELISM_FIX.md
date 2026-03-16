# 🚨 Error: No Hosted Parallelism en Azure DevOps

## El Problema

```
No hosted parallelism has been purchased or granted.
To request a free parallelism grant, please fill out the following form
https://aka.ms/azpipelines-parallelism-request
```

Desde 2021, Microsoft requiere que los proyectos nuevos de Azure DevOps soliciten parallelismo gratuito para usar Microsoft-hosted agents.

---

## ✅ Solución Rápida: GitHub Actions (RECOMENDADO)

He configurado **GitHub Actions** como alternativa que funciona inmediatamente sin restricciones.

### Ventajas de GitHub Actions:
- ✅ **2000 minutos gratis/mes** (suficiente para TFM)
- ✅ **Funciona inmediatamente** (sin solicitudes)
- ✅ **Más simple de configurar**
- ✅ **Mejor para proyectos académicos**
- ✅ **Ya integrado con tu repositorio GitHub**

### Archivos Creados:

```
.github/workflows/
├── backend.yml    # CI/CD para Backend Flask
└── frontend.yml   # CI/CD para Frontend Angular
```

---

## 🔧 Configurar GitHub Actions (5 minutos)

### 1️⃣ Crear Azure Service Principal

Necesitas credenciales para que GitHub pueda deployar a Azure:

```bash
cd ~/TFM/TFM-FlysSeats

# Obtener tu Subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Crear Service Principal
az ad sp create-for-rbac \
  --name "github-actions-flyseats" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/flyseats2-dev-rg \
  --sdk-auth
```

**IMPORTANTE**: Copia todo el JSON que devuelve. Lo necesitarás en el siguiente paso.

### 2️⃣ Agregar Secret en GitHub

1. Ve a tu repositorio: https://github.com/YoelPerezCarrasco/TFM-FlysSeats
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AZURE_CREDENTIALS`
5. Value: Pega el JSON completo del paso anterior
6. **Add secret**

### 3️⃣ Hacer Push y Ver la Magia ✨

```bash
cd ~/TFM/TFM-FlysSeats

# Agregar los workflows
git add .github/workflows/

git commit -m "ci: Add GitHub Actions workflows for CI/CD"

git push origin main
```

Ve a: https://github.com/YoelPerezCarrasco/TFM-FlysSeats/actions

Verás el pipeline ejecutándose automáticamente! 🎉

---

## 📋 Alternativa 1: Solicitar Grant de Azure DevOps

Si prefieres usar Azure DevOps (tarda 2-3 días en aprobarse):

### Paso 1: Llenar el Formulario

1. Ve a: https://aka.ms/azpipelines-parallelism-request
2. Llena el formulario:
   - **Organization**: https://dev.azure.com/flyseats
   - **Project**: TFM-FlySeats
   - **Reason**: Academic thesis project (TFM) - FlysSeats flight booking system
   - **Are you requesting a parallelism increase?**: No, requesting free grant
   - **Email**: Tu email de estudiante

### Paso 2: Esperar Aprobación

- Microsoft responde en 2-3 días hábiles
- Te darán 1 parallel job gratuito
- Suficiente para tu TFM

### Paso 3: Activar Pipelines

Una vez aprobado, tus pipelines de Azure DevOps funcionarán automáticamente.

---

## 📋 Alternativa 2: Self-Hosted Agent (Avanzado)

Si necesitas algo funcionando HOY y no quieres GitHub Actions:

### En tu máquina local:

```bash
# Descargar agent
mkdir ~/azagent && cd ~/azagent
wget https://vstsagentpackage.azureedge.net/agent/3.236.1/vsts-agent-linux-x64-3.236.1.tar.gz
tar zxvf vsts-agent-linux-x64-3.236.1.tar.gz

# Configurar
./config.sh

# Durante la configuración:
# Server URL: https://dev.azure.com/flyseats
# PAT: Tu PAT de Azure DevOps
# Agent pool: Default
# Agent name: local-agent

# Ejecutar como servicio
sudo ./svc.sh install
sudo ./svc.sh start
```

### Actualizar Pipeline:

En `azure-pipelines-backend.yml`, cambia:

```yaml
pool:
  name: Default  # Usar tu self-hosted agent
  # vmImage: 'ubuntu-latest'  # Comentar esta línea
```

---

## 🎯 Comparación de Opciones

| Opción | Tiempo Setup | Costo | Minutos Gratis | Recomendado |
|--------|--------------|-------|----------------|-------------|
| **GitHub Actions** | 5 min | €0 | 2000/mes | ✅ **SÍ** |
| Azure DevOps Grant | 2-3 días | €0 | 1800/mes | Para después |
| Self-Hosted Agent | 30 min | €0 | ∞ | Solo si necesario |

---

## 🚀 Workflow con GitHub Actions

```bash
# Desarrollo normal
git add .
git commit -m "feat: Nueva funcionalidad"
git push origin main

# GitHub Actions automáticamente:
# 1. ✅ Build del backend
# 2. ✅ Tests (cuando los agregues)  
# 3. ✅ Deploy a Azure App Service
# 4. ✅ Health check
```

---

## 🔍 Ver Pipelines en Acción

### GitHub Actions:
- URL: https://github.com/YoelPerezCarrasco/TFM-FlysSeats/actions
- Logs en tiempo real
- Notificaciones por email
- Badge en README

### Azure DevOps (cuando funcione):
- URL: https://dev.azure.com/flyseats/TFM-FlySeats/_build

---

## 📝 Próximos Pasos

### Con GitHub Actions (ahora mismo):

1. ✅ Crear Service Principal (comando arriba)
2. ✅ Agregar `AZURE_CREDENTIALS` en GitHub Secrets
3. ✅ Push los workflows
4. ✅ Ver el deployment automático

### Con Azure DevOps (paralelo):

1. ✅ Llenar formulario de grant
2. ⏳ Esperar 2-3 días
3. ✅ Pipelines funcionarán automáticamente

---

## 🐛 Troubleshooting

### Error en GitHub Actions: "Login failed"
→ Verifica que el secret `AZURE_CREDENTIALS` esté correcto

### Error: "Resource group not found"
→ Asegúrate que el Service Principal tenga permisos en `flyseats2-dev-rg`

### Pipeline no se ejecuta automáticamente
→ Verifica que los workflows estén en `.github/workflows/` en rama `main`

---

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/actions)
- [Azure DevOps Parallelism Request](https://aka.ms/azpipelines-parallelism-request)
- [Deploy to Azure with GitHub Actions](https://learn.microsoft.com/azure/developer/github/deploy-to-azure)

---

**Recomendación**: Usa GitHub Actions ahora para tu TFM. Funciona perfectamente y es más simple para proyectos académicos. Puedes solicitar el grant de Azure DevOps en paralelo para tenerlo como opción.
