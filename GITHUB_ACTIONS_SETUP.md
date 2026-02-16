# ⚡ GitHub Actions - Configuración Rápida

## ✅ Solución al Error de Azure DevOps

Azure DevOps requiere solicitar parallelismo gratuito (tarda 2-3 días).  
**GitHub Actions funciona INMEDIATAMENTE** - 2000 minutos gratis/mes.

---

## 🚀 Setup en 3 Pasos (5 minutos)

### 1️⃣ Copiar Publish Profile

Ejecuta para obtener las credenciales:

```bash
cd ~/TFM/TFM-FlysSeats
az webapp deployment list-publishing-profiles \
  --name flyseats2-dev-api \
  --resource-group flyseats2-dev-rg \
  --xml
```

Copia **TODO** el output (desde `<publishData>` hasta `</publishData>`).

### 2️⃣ Agregar Secret en GitHub

1. Ve a: https://github.com/YoelPerezCarrasco/TFM-FlysSeats/settings/secrets/actions
2. Click **New repository secret**
3. Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
4. Value: Pega el XML completo
5. **Add secret**

### 3️⃣ Activar el Workflow

```bash
cd ~/TFM/TFM-FlysSeats

# Hacer un cambio pequeño para trigger
echo "# GitHub Actions configured" >> backend/README.md

git add backend/README.md
git commit -m "trigger: Activate GitHub Actions workflow"
git push origin main
```

**🎉 Listo!** Ve a:  
https://github.com/YoelPerezCarrasco/TFM-FlysSeats/actions

El pipeline se ejecutará automáticamente y desplegará el backend a Azure.

---

## 📊 Workflows Configurados

### 1. Backend Deploy (`backend-deploy.yml`)
- **Trigger**: Push a `main` con cambios en `backend/**`
- **Acción**: Build, package y deploy a Azure App Service
- **Test**: Health check post-deployment

### 2. API Health Check (`health-check.yml`)
- **Trigger**: Cada 6 horas + manual
- **Acción**: Verifica que la API esté funcionando

---

## 🔄 Workflow Diario

```bash
# Tu desarrollo normal
git add .
git commit -m "feat: Nueva funcionalidad"
git push origin main

# GitHub Actions automáticamente:
# ✅ Build
# ✅ Test  
# ✅ Deploy a Azure
# ✅ Verificación
```

---

## 🎯 Ventajas vs Azure DevOps

| Feature | GitHub Actions | Azure DevOps |
|---------|---------------|--------------|
| Setup Time | 5 min | 2-3 días |
| Free Minutes | 2000/mes | 1800/mes (tras aprobación) |
| Configuración | Más simple | Más compleja |
| Para TFM | ✅ **Ideal** | Alternativa |

---

## 📝 Estado Actual

✅ **Workflows creados y commitados**  
✅ **Publish profile obtenido**  
⏳ **Falta**: Agregar secret en GitHub  
⏳ **Falta**: Hacer push para trigger

---

## 🐛 Troubleshooting

### Error: "Secret not found"
→ Verifica que el secret se llame exactamente `AZURE_WEBAPP_PUBLISH_PROFILE`

### Workflow no se ejecuta
→ Debe haber cambios en `backend/**` en rama `main`

### Deploy falla
→ Verifica que el Publish Profile esté completo y sea válido

---

## 📚 Alternativa: Azure DevOps

Si quieres usar Azure DevOps en paralelo:

1. Solicita grant: https://aka.ms/azpipelines-parallelism-request
2. En 2-3 días Microsoft aprobará
3. Los pipelines de Azure DevOps funcionarán automáticamente

Ver: [AZURE_DEVOPS_PARALLELISM_FIX.md](AZURE_DEVOPS_PARALLELISM_FIX.md)  
Ver: [DEVOPS_SETUP.md](DEVOPS_SETUP.md)

---

**TL;DR**: GitHub Actions es más rápido y simple para tu TFM. Solo necesitas agregar un secret y hacer push.
