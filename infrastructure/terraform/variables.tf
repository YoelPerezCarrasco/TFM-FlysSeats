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
  default     = "swedencentral"  # Región permitida por Azure for Students
  
  validation {
    condition     = contains(["italynorth", "norwayeast", "spaincentral", "germanywestcentral", "swedencentral"], var.location)
    error_message = "Location must be one of the regions allowed by Azure for Students policy."
  }
}

variable "app_service_sku" {
  description = "App Service plan SKU for frontend (F1 for TFM/dev, B1 for prod)"
  type        = string
  default     = "F1"  # FREE tier for TFM
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

variable "enable_redis" {
  description = "Enable Redis Cache (disable for TFM to save costs)"
  type        = bool
  default     = false  # Disabled for TFM - uses Cosmos DB cache instead
}

variable "cosmos_free_tier" {
  description = "Use Cosmos DB free tier (400 RU/s free forever)"
  type        = bool
  default     = true  # Free tier for TFM
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
