variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "grouppay"
}

variable "environment" {
  description = "Environment name (development, production)"
  type        = string
  default     = "production"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "West US"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "grouppay-rg"
}

variable "app_service_sku" {
  description = "SKU for the App Service Plan"
  type        = string
  default     = "F1" # Free tier to avoid quota issues
}

variable "db_admin_username" {
  description = "Administrator username for PostgreSQL"
  type        = string
  default     = "grouppay_admin"
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "grouppay"
}

variable "db_sku_name" {
  description = "SKU name for PostgreSQL Flexible Server"
  type        = string
  default     = "B_Standard_B1ms" # Burstable tier for cost optimization
}

variable "db_storage_mb" {
  description = "Storage size in MB for PostgreSQL"
  type        = number
  default     = 32768 # 32GB
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Application = "GroupPay"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

# Optional features (disabled by default for cost optimization)
variable "create_key_vault" {
  description = "Whether to create Key Vault for secrets"
  type        = bool
  default     = false
}

variable "create_storage_account" {
  description = "Whether to create Storage Account for file uploads"
  type        = bool
  default     = false
}

variable "create_app_insights" {
  description = "Whether to create Application Insights for monitoring"
  type        = bool
  default     = false
}

variable "db_allow_all_ips" {
  description = "Whether to allow all IPs to access the database (for development only - security risk in production)"
  type        = bool
  default     = false
}

variable "db_allowed_ips" {
  description = "List of specific IP addresses to allow database access"
  type        = list(string)
  default     = []
}