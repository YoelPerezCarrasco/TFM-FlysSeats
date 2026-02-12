variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "flyseats"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "westeurope"  # Cambio a Europa para mejor latencia
  
  validation {
    condition     = contains(["westeurope", "northeurope", "eastus", "westus2"], var.location)
    error_message = "Location must be a valid Azure region."
  }
}

variable "app_service_sku" {
  description = "App Service plan SKU for frontend"
  type        = string
  default     = "B1"
}

variable "publisher_name" {
  description = "API Management publisher name"
  type        = string
  default     = "FlysSeats Team"
}

variable "publisher_email" {
  description = "API Management publisher email"
  type        = string
  default     = "admin@flyseats.com"
}

variable "amadeus_api_key" {
  description = "Amadeus API Key (opcional, se puede configurar después)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "amadeus_api_secret" {
  description = "Amadeus API Secret (opcional, se puede configurar después)"
  type        = string
  default     = ""
  sensitive   = true
}
