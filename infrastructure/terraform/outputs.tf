output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}

output "function_app_name" {
  description = "Function App name"
  value       = azurerm_linux_function_app.main.name
}

output "function_app_default_hostname" {
  description = "Function App default hostname"
  value       = azurerm_linux_function_app.main.default_hostname
}

output "web_app_name" {
  description = "Web App name"
  value       = azurerm_linux_web_app.frontend.name
}

output "web_app_default_hostname" {
  description = "Web App default hostname"
  value       = azurerm_linux_web_app.frontend.default_hostname
}
