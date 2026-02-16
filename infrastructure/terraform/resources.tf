# ============================================
# INFRAESTRUCTURA SIMPLIFICADA PARA TFM
# Sin Azure Functions - Solo App Services
# ============================================

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location

  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-${var.environment}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "${var.project_name}-${var.environment}-insights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Key Vault
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                       = "${var.project_name}-${var.environment}-kv"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge", "Recover"
    ]
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Secretos Amadeus API
resource "azurerm_key_vault_secret" "amadeus_api_key" {
  name         = "amadeus-api-key"
  value        = var.amadeus_api_key
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "amadeus_api_secret" {
  name         = "amadeus-api-secret"
  value        = var.amadeus_api_secret
  key_vault_id = azurerm_key_vault.main.id
}

# ============================================
# COSMOS DB (FREE TIER)
# ============================================
resource "azurerm_cosmosdb_account" "main" {
  name                = "${var.project_name}-${var.environment}-cosmos"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  enable_free_tier = var.cosmos_free_tier

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "azurerm_cosmosdb_sql_database" "main" {
  name                = "${var.project_name}-db"
  resource_group_name = azurerm_cosmosdb_account.main.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
}

resource "azurerm_cosmosdb_sql_container" "users" {
  name                = "users"
  resource_group_name = azurerm_cosmosdb_account.main.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_path  = "/userId"
}

resource "azurerm_cosmosdb_sql_container" "bookings" {
  name                = "bookings"
  resource_group_name = azurerm_cosmosdb_account.main.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_path  = "/userId"
}

resource "azurerm_cosmosdb_sql_container" "flights_cache" {
  name                = "flights-cache"
  resource_group_name = azurerm_cosmosdb_account.main.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.main.name
  partition_key_path  = "/searchKey"
  
  default_ttl = 3600  # 1 hora de cache
}

# ============================================
# STORAGE ACCOUNT
# ============================================
resource "azurerm_storage_account" "main" {
  name                     = "${var.project_name}${var.environment}data"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "tickets" {
  name                  = "tickets"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# ============================================
# APP SERVICE PLAN (compartido para backend y frontend)
# ============================================
resource "azurerm_service_plan" "main" {
  name                = "${var.project_name}-${var.environment}-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# ============================================
# BACKEND API (Flask/Python)
# ============================================
resource "azurerm_linux_web_app" "backend" {
  name                = "${var.project_name}-${var.environment}-api"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = var.app_service_sku == "F1" ? false : true

    application_stack {
      python_version = "3.9"
    }

    cors {
      allowed_origins     = ["*"]
      support_credentials = false
    }
  }

  app_settings = {
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
    "APPINSIGHTS_INSTRUMENTATIONKEY" = azurerm_application_insights.main.instrumentation_key
    
    # Cosmos DB
    "COSMOS_ENDPOINT"   = azurerm_cosmosdb_account.main.endpoint
    "COSMOS_KEY"        = azurerm_cosmosdb_account.main.primary_key
    "COSMOS_DATABASE"   = azurerm_cosmosdb_sql_database.main.name
    
    # Key Vault
    "KEY_VAULT_URL" = azurerm_key_vault.main.vault_uri
    
    # Storage
    "STORAGE_CONNECTION_STRING" = azurerm_storage_account.main.primary_connection_string
    
    # Amadeus API
    "AMADEUS_API_KEY"    = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault.main.vault_uri}secrets/amadeus-api-key/)"
    "AMADEUS_API_SECRET" = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault.main.vault_uri}secrets/amadeus-api-secret/)"
    
    # Redis deshabilitado
    "REDIS_ENABLED" = "false"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Permisos del backend al Key Vault
resource "azurerm_key_vault_access_policy" "backend" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = azurerm_linux_web_app.backend.identity[0].tenant_id
  object_id    = azurerm_linux_web_app.backend.identity[0].principal_id

  secret_permissions = [
    "Get", "List"
  ]
}

# ============================================
# NOTA: Frontend se ejecuta localmente
# Para TFM: cd flyseats-frontend && npm start
# Se puede migrar a la nube más adelante
# ============================================
