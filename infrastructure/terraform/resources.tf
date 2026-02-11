# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Storage Account for Azure Functions
resource "azurerm_storage_account" "functions" {
  name                     = "${var.project_name}${var.environment}storage"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# App Service Plan for Azure Functions
resource "azurerm_service_plan" "functions" {
  name                = "${var.project_name}-${var.environment}-functions-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "Y1"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Azure Function App
resource "azurerm_linux_function_app" "main" {
  name                = "${var.project_name}-${var.environment}-functions"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key
  service_plan_id            = azurerm_service_plan.functions.id

  site_config {
    application_stack {
      python_version = "3.9"
    }

    cors {
      allowed_origins = ["*"]
    }
  }

  app_settings = {
    "FUNCTIONS_WORKER_RUNTIME" = "python"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# App Service Plan for Web App
resource "azurerm_service_plan" "webapp" {
  name                = "${var.project_name}-${var.environment}-webapp-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Linux Web App for Angular Frontend
resource "azurerm_linux_web_app" "frontend" {
  name                = "${var.project_name}-${var.environment}-webapp"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.webapp.id

  site_config {
    always_on = false

    application_stack {
      node_version = "18-lts"
    }
  }

  app_settings = {
    "WEBSITE_NODE_DEFAULT_VERSION" = "18-lts"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}
