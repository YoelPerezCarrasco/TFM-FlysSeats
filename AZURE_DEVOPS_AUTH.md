# 🔐 Configuración de Autenticación Azure DevOps

## Problema: Authentication failed for Azure DevOps

Para conectar tu repositorio local con Azure DevOps, necesitas un **Personal Access Token (PAT)**.

---

## 🎯 Solución Rápida: Agregar Azure DevOps como Remote

### Paso 1: Crear Personal Access Token (PAT)

1. **Ve a Azure DevOps**: https://dev.azure.com/flyseats
2. Click en tu icono de usuario (esquina superior derecha)
3. Selecciona **Personal Access Tokens**
4. Click **+ New Token**
5. Configura:
   - **Name**: `TFM-FlysSeats-PAT`
   - **Organization**: flyseats
   - **Expiration**: 90 días (o custom)
   - **Scopes**: Selecciona **Custom defined**
     - ✅ **Code** → Read, write, & manage
     - ✅ **Build** → Read & execute
     - ✅ **Release** → Read, write, execute & manage
6. Click **Create**
7. **IMPORTANTE**: Copia el token (solo se muestra una vez)
   ```
   Ejemplo: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Paso 2: Configurar Git con el PAT

```bash
# Opción A: Agregar Azure DevOps como remote adicional (RECOMENDADO)
cd ~/TFM/TFM-FlysSeats

# Ver remotes actuales
git remote -v

# Agregar Azure DevOps como remote
git remote add azuredevops https://<TU_PAT>@dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats

# Verificar
git remote -v

# Push a Azure DevOps (primera vez)
git push azuredevops main --force

# O si quieres pushear todas las ramas
git push azuredevops --all
```

### Paso 3: Configurar para pushear a ambos remotes automáticamente

```bash
# Agregar push URL adicional a origin
git remote set-url --add --push origin https://<TU_PAT>@dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats

# Ver configuración
git remote -v
# Ahora cuando hagas 'git push', irá a ambos: GitHub y Azure DevOps
```

---

## 🔧 Opción B: Usar Git Credential Manager (más seguro)

Si prefieres no poner el PAT en la URL:

```bash
# Instalar Git Credential Manager (si no lo tienes)
# En WSL/Linux:
wget https://github.com/git-ecosystem/git-credential-manager/releases/download/v2.4.1/gcm-linux_amd64.2.4.1.deb
sudo dpkg -i gcm-linux_amd64.2.4.1.deb

# Configurar
git config --global credential.helper manager

# Agregar remote SIN el PAT en la URL
git remote add azuredevops https://dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats

# Al hacer push te pedirá credenciales (usa el PAT como password)
git push azuredevops main
```

---

## 📋 Comandos Prácticos

### Ver remotes configurados
```bash
git remote -v
```

### Push a GitHub (origin)
```bash
git push origin main
```

### Push a Azure DevOps
```bash
git push azuredevops main
```

### Push a ambos al mismo tiempo
```bash
git push --all
```

### Cambiar el PAT si expira
```bash
# Actualizar URL con nuevo PAT
git remote set-url azuredevops https://<NUEVO_PAT>@dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats
```

---

## 🎯 Flujo de Trabajo Recomendado

```bash
# Tu workflow diario:

# 1. Hacer cambios
git add .
git commit -m "feat: Nueva funcionalidad"

# 2. Push a GitHub
git push origin main

# 3. Push a Azure DevOps (trigger del pipeline)
git push azuredevops main

# O push a ambos a la vez (si configuraste ambos push URLs)
git push
```

---

## ⚠️ Importante: Seguridad del PAT

### NO COMMITEES EL PAT

Si accidentalmente pusiste el PAT en algún archivo:

```bash
# Asegúrate de que .env está en .gitignore
echo "*.pat" >> .gitignore
echo ".azure-credentials" >> .gitignore

# Si ya lo commiteaste:
git rm --cached archivo-con-pat
git commit -m "Remove PAT from repo"
```

### Almacenar PAT de forma segura

```bash
# Opción 1: Variable de entorno
echo 'export AZURE_DEVOPS_PAT="tu_pat_aqui"' >> ~/.bashrc
source ~/.bashrc

# Usar en comandos
git remote add azuredevops https://${AZURE_DEVOPS_PAT}@dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats

# Opción 2: Archivo seguro
echo "tu_pat_aqui" > ~/.azure-devops-pat
chmod 600 ~/.azure-devops-pat

PAT=$(cat ~/.azure-devops-pat)
git remote add azuredevops https://${PAT}@dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats
```

---

## 🚨 Troubleshooting

### Error: remote azuredevops already exists
```bash
# Eliminar y volver a agregar
git remote remove azuredevops
git remote add azuredevops https://<PAT>@dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats
```

### Error: failed to push some refs
```bash
# Primera vez: force push
git push azuredevops main --force

# O pull primero
git pull azuredevops main --allow-unrelated-histories
git push azuredevops main
```

### Error: Authentication failed
```bash
# Verificar que el PAT es válido
# Regenerar PAT en Azure DevOps
# Actualizar la URL del remote
git remote set-url azuredevops https://<NUEVO_PAT>@dev.azure.com/flyseats/TFM-FlySeats/_git/TFM-FlysSeats
```

### Ver logs detallados
```bash
GIT_CURL_VERBOSE=1 git push azuredevops main
```

---

## ✅ Checklist de Verificación

- [ ] PAT creado en Azure DevOps con permisos de Code (Read, write, manage)
- [ ] Remote `azuredevops` agregado correctamente
- [ ] Test: `git ls-remote azuredevops` funciona sin error
- [ ] Primera push exitoso a Azure DevOps
- [ ] Pipeline de Azure DevOps se activó automáticamente
- [ ] PAT almacenado de forma segura (no en el repo)

---

## 🔄 Alternativa: Sincronizar GitHub → Azure DevOps automáticamente

Si prefieres mantener GitHub como principal y sincronizar automáticamente:

### En Azure Pipelines (crear azure-pipelines-sync.yml):
```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - checkout: self
    persistCredentials: true
  
  - script: |
      git remote add github https://github.com/YoelPerezCarrasco/TFM-FlysSeats.git
      git fetch github
      git merge github/main --allow-unrelated-histories
      git push origin main
    displayName: 'Sync from GitHub'
```

---

## 📚 Recursos

- [Azure DevOps PATs Documentation](https://docs.microsoft.com/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)
- [Git Credential Manager](https://github.com/git-ecosystem/git-credential-manager)
- [Multiple Git Remotes](https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes)
