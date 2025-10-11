# Configure the Azure Provider
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~>3.1"
    }
  }

  # Using local backend for now due to storage account creation issue
  # Uncomment below and comment out backend block above when storage account is ready
  # backend "azurerm" {
  #   resource_group_name  = "grouppay-terraform-rg"
  #   storage_account_name = "grouppayterraformstate804593"
  #   container_name       = "terraform-state"
  #   key                  = "terraform.tfstate"
  # }
}

# Configure the Microsoft Azure Provider
provider "azurerm" {
  features {}
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Create Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = var.tags
}

# Create App Service Plan
resource "azurerm_service_plan" "main" {
  name                = "${var.app_name}-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku

  tags = var.tags
}

# Create PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "${var.app_name}-postgres"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "15"
  delegated_subnet_id    = null
  private_dns_zone_id    = null
  administrator_login    = var.db_admin_username
  administrator_password = random_password.db_password.result
  # zone removed due to availability zone not being available in westus

  storage_mb = var.db_storage_mb
  sku_name   = var.db_sku_name

  backup_retention_days        = 7
  geo_redundant_backup_enabled = false

  tags = var.tags
}

# Create PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# PostgreSQL Firewall Rule - Allow Azure Services
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# PostgreSQL Firewall Rule - Allow All (for development - restrict in production)
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_all" {
  count            = var.environment == "development" ? 1 : 0
  name             = "AllowAll"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"
}

# Create Linux Web App (API)
resource "azurerm_linux_web_app" "api" {
  name                = "${var.app_name}-api"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_service_plan.main.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    application_stack {
      node_version = "18-lts"
    }
    
    always_on = false # F1 tier doesn't support always_on
    
    cors {
      allowed_origins = [
        "https://${azurerm_static_web_app.main.default_host_name}",
        var.environment == "development" ? "http://localhost:5173" : ""
      ]
      support_credentials = true
    }
  }

  app_settings = {
    "DATABASE_URL"                = "postgresql://${var.db_admin_username}:${random_password.db_password.result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.db_name}?sslmode=require"
    "JWT_SECRET"                  = random_password.jwt_secret.result
    "NODE_ENV"                    = var.environment == "development" ? "development" : "production"
    "PORT"                        = "8080"
    "WEBSITE_NODE_DEFAULT_VERSION" = "~18"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
  }

  tags = var.tags
}

# Random JWT secret
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

# Create Static Web App (Frontend)
resource "azurerm_static_web_app" "main" {
  name                = "${var.app_name}-web"
  resource_group_name = azurerm_resource_group.main.name
  location            = "West US 2" # Static Web Apps have limited regions
  sku_tier            = "Free"
  sku_size            = "Free"

  tags = var.tags
}

# Optional: Key Vault for secrets (commented out for cost optimization)
# resource "azurerm_key_vault" "main" {
#   count                       = var.create_key_vault ? 1 : 0
#   name                        = "${var.app_name}-kv"
#   location                    = azurerm_resource_group.main.location
#   resource_group_name         = azurerm_resource_group.main.name
#   enabled_for_disk_encryption = true
#   tenant_id                   = data.azurerm_client_config.current.tenant_id
#   soft_delete_retention_days  = 7
#   purge_protection_enabled    = false
#   sku_name                    = "standard"

#   access_policy {
#     tenant_id = data.azurerm_client_config.current.tenant_id
#     object_id = data.azurerm_client_config.current.object_id

#     secret_permissions = [
#       "Get",
#       "List",
#       "Set",
#       "Delete",
#       "Recover",
#       "Backup",
#       "Restore"
#     ]
#   }

#   tags = var.tags
# }

# Optional: Storage Account for file uploads (commented out for cost optimization)
# resource "azurerm_storage_account" "main" {
#   count                    = var.create_storage_account ? 1 : 0
#   name                     = "${replace(var.app_name, "-", "")}storage"
#   resource_group_name      = azurerm_resource_group.main.name
#   location                 = azurerm_resource_group.main.location
#   account_tier             = "Standard"
#   account_replication_type = "LRS"

#   tags = var.tags
# }

# resource "azurerm_storage_container" "receipts" {
#   count                 = var.create_storage_account ? 1 : 0
#   name                  = "receipts"
#   storage_account_name  = azurerm_storage_account.main[0].name
#   container_access_type = "private"
# }

# Optional: Application Insights (commented out for cost optimization)
# resource "azurerm_log_analytics_workspace" "main" {
#   count               = var.create_app_insights ? 1 : 0
#   name                = "${var.app_name}-workspace"
#   location            = azurerm_resource_group.main.location
#   resource_group_name = azurerm_resource_group.main.name
#   sku                 = "PerGB2018"
#   retention_in_days   = 30

#   tags = var.tags
# }

# resource "azurerm_application_insights" "main" {
#   count               = var.create_app_insights ? 1 : 0
#   name                = "${var.app_name}-insights"
#   location            = azurerm_resource_group.main.location
#   resource_group_name = azurerm_resource_group.main.name
#   workspace_id        = azurerm_log_analytics_workspace.main[0].id
#   application_type    = "Node.JS"

#   tags = var.tags
# }

# data "azurerm_client_config" "current" {}