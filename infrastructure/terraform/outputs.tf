# ============================================
# RESOURCE GROUP
# ============================================
output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Resource group location"
  value       = azurerm_resource_group.main.location
}

# ============================================
# FUNCTION APP (Backend API)
# ============================================
output "function_app_name" {
  description = "Function App name"
  value       = azurerm_linux_function_app.main.name
}

output "function_app_url" {
  description = "Function App URL"
  value       = "https://${azurerm_linux_function_app.main.default_hostname}"
}

output "function_app_principal_id" {
  description = "Function App Managed Identity Principal ID"
  value       = azurerm_linux_function_app.main.identity[0].principal_id
}

# ============================================
# WEB APP (Frontend)
# ============================================
output "web_app_name" {
  description = "Web App name"
  value       = azurerm_linux_web_app.frontend.name
}

output "web_app_url" {
  description = "Web App URL"
  value       = "https://${azurerm_linux_web_app.frontend.default_hostname}"
}

# ============================================
# COSMOS DB
# ============================================
output "cosmos_endpoint" {
  description = "Cosmos DB endpoint"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "cosmos_database_name" {
  description = "Cosmos DB database name"
  value       = azurerm_cosmosdb_sql_database.main.name
}

output "cosmos_connection_string" {
  description = "Cosmos DB connection string"
  value       = azurerm_cosmosdb_account.main.connection_strings[0]
  sensitive   = true
}

# ============================================
# REDIS CACHE
# ============================================
output "redis_hostname" {
  description = "Redis Cache hostname"
  value       = azurerm_redis_cache.main.hostname
}

output "redis_ssl_port" {
  description = "Redis Cache SSL port"
  value       = azurerm_redis_cache.main.ssl_port
}

output "redis_primary_key" {
  description = "Redis Cache primary key"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

# ============================================
# KEY VAULT
# ============================================
output "key_vault_name" {
  description = "Key Vault name"
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

# ============================================
# APPLICATION INSIGHTS
# ============================================
output "application_insights_name" {
  description = "Application Insights name"
  value       = azurerm_application_insights.main.name
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

# ============================================
# STORAGE ACCOUNTS
# ============================================
output "storage_account_name" {
  description = "Data Storage Account name"
  value       = azurerm_storage_account.data.name
}

output "storage_primary_connection_string" {
  description = "Storage primary connection string"
  value       = azurerm_storage_account.data.primary_connection_string
  sensitive   = true
}

# ============================================
# CDN (solo en producción)
# ============================================
output "cdn_endpoint_url" {
  description = "CDN endpoint URL (producción)"
  value       = var.environment == "prod" ? "https://${azurerm_cdn_endpoint.frontend[0].name}.azureedge.net" : "N/A (solo producción)"
}

# ============================================
# API MANAGEMENT (solo en producción)
# ============================================
output "apim_gateway_url" {
  description = "API Management gateway URL (producción)"
  value       = var.environment == "prod" ? azurerm_api_management.main[0].gateway_url : "N/A (solo producción)"
}

# ============================================
# DEPLOYMENT COMMANDS
# ============================================
output "deployment_info" {
  description = "Información importante para el despliegue"
  value = <<-EOT
  
  ✅ Infraestructura desplegada exitosamente!
  
  📋 SIGUIENTE PASO: Configurar secretos en Key Vault
  
  az keyvault secret set --vault-name ${azurerm_key_vault.main.name} --name "amadeus-api-key" --value "TU_API_KEY"
  az keyvault secret set --vault-name ${azurerm_key_vault.main.name} --name "amadeus-api-secret" --value "TU_API_SECRET"
  
  📋 URLs de acceso:
  - Frontend: https://${azurerm_linux_web_app.frontend.default_hostname}
  - API Backend: https://${azurerm_linux_function_app.main.default_hostname}
  - Application Insights: https://portal.azure.com/#resource${azurerm_application_insights.main.id}
  
  📋 Para desplegar el código:
  
  # Backend (Functions)
  cd backend
  func azure functionapp publish ${azurerm_linux_function_app.main.name}
  
  # Frontend (Web App)
  cd flyseats-frontend
  npm run build:prod
  az webapp deployment source config-zip --resource-group ${azurerm_resource_group.main.name} --name ${azurerm_linux_web_app.frontend.name} --src dist.zip
  
  EOT
}
