# ============================================
# CONFIGURACIÓN ULTRA-ECONÓMICA PARA TFM
# ============================================
# Este archivo contiene configuración optimizada para
# Trabajos Fin de Máster con COSTOS MÍNIMOS
#
# Costo estimado: €0-10/mes (casi GRATIS)
# ============================================

project_name = "flyseats2"
environment  = "dev"
location     = "germanywestcentral"

# ============================================
# SERVICIOS GRATIS/ECONÓMICOS
# ============================================

# App Service: FREE F1 tier (100% gratis)
app_service_sku = "F1"

# Cosmos DB: FREE TIER deshabilitado temporalmente
# (ya existe otro en la suscripción - solo se permite 1)
cosmos_free_tier = false

# Redis Cache: DESHABILITADO (ahorra ~€17/mes)
# Usamos Cosmos DB para cache, suficiente para TFM
enable_redis = false

# ============================================
# CONFIGURACIONES ADICIONALES
# ============================================

# Información para API Management (no se crea en dev)
publisher_name  = "FlysSeats TFM"
publisher_email = "tfm@flyseats.dev"

# ⚠️ NO incluir aquí las credenciales de Amadeus
# Se cargan desde variables de entorno
