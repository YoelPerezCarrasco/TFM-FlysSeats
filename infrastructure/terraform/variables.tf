variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "flyseats"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "app_service_sku" {
  description = "App Service plan SKU"
  type        = string
  default     = "B1"
}
