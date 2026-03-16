# Workflows Deshabilitados

Estos workflows antiguos están deshabilitados porque:

1. **backend-ci-cd.yml** - Configurado para Azure Functions (ya no usado)
2. **deploy-azure.yml** - Requiere Service Principal (Azure for Students no puede crearlo)
3. **frontend-ci-cd.yml** - Frontend se ejecuta localmente para el TFM
4. **terraform.yml** - Infraestructura ya desplegada manualmente

## Workflows Activos

Los workflows que SÍ están activos y funcionando:

- ✅ **backend-deploy.yml** - Deploy automático del backend a Azure
- ✅ **health-check.yml** - Monitoreo de la API cada 6 horas

Estos workflows usan Publish Profile (método simple, sin Service Principal).

## Restaurar un Workflow

Si necesitas restaurar alguno:

```bash
mv .github/workflows/_disabled/NOMBRE.yml .github/workflows/
```

Pero recuerda que necesitarás configurar los secrets correspondientes.
