# ============================================
# OUTPUTS - Infraestructura Simplificada
# ============================================

# Resource Group
output "resource_group_name" {
  description = "Resource Group name"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Resource Group location"
  value       = azurerm_resource_group.main.location
}

# Backend API
output "backend_api_name" {
  description = "Backend API name"
  value       = azurerm_linux_web_app.backend.name
}

output "backend_api_url" {
  description = "Backend API URL"
  value       = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

# Frontend
output "web_app_info" {
  description = "Frontend deployment info"
  value       = "Frontend se ejecuta localmente. Ejecutar: cd flyseats-frontend && npm start"
}

# Cosmos DB
output "cosmos_endpoint" {
  description = "Cosmos DB endpoint"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "cosmos_database_name" {
  description = "Cosmos DB database name"
  value       = azurerm_cosmosdb_sql_database.main.name
}

# Storage
output "storage_account_name" {
  description = "Storage Account name"
  value       = azurerm_storage_account.main.name
}

# Key Vault
output "key_vault_name" {
  description = "Key Vault name"
  value       = azurerm_key_vault.main.name
}

# Application Insights
output "application_insights_name" {
  description = "Application Insights name"
  value       = azurerm_application_insights.main.name
}

# Deployment Info
output "deployment_info" {
  description = "Información de despliegue"
  value       = <<EOT
  
✅ Infraestructura desplegada!
  
📋 URLs:
- Backend API: https://${azurerm_linux_web_app.backend.default_hostname}
- Frontend: http://localhost:4200 (ejecutar localmente con: cd flyseats-frontend && npm start)
  
💰 Coste: €5-10/mes (Backend F1 + Cosmos DB Serverless)
  
📝 Recursos desplegados:
- Azure Cosmos DB (Serverless)
- Azure App Service (Backend API Python/Flask)
- Azure Storage Account (Blob containers)
- Azure Key Vault (Credenciales Amadeus)
- Application Insights + Log Analytics
EOT
}
