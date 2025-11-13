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
# Uses service principal authentication via environment variables in CI/CD:
# ARM_CLIENT_ID, ARM_CLIENT_SECRET, ARM_SUBSCRIPTION_ID, ARM_TENANT_ID
provider "azurerm" {
  features {}
}

# Random password for database
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Local value to properly encode database password for connection string
locals {
  # URL-encode the password by replacing special characters
  db_password_encoded = replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(random_password.db_password.result, "%", "%25"),
                "@", "%40"
              ),
              ":", "%3A"
            ),
            "/", "%2F"
          ),
          "?", "%3F"
        ),
        "#", "%23"
      ),
      "[", "%5B"
    ),
    "]", "%5D"
  )

  # Construct database URL with properly encoded password
  database_url = "postgresql://${var.db_admin_username}:${local.db_password_encoded}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.db_name}?sslmode=require"

  # Construct CORS_ORIGIN: Static Web App URL + any additional origins
  static_web_app_url = "https://${azurerm_static_web_app.main.default_host_name}"
  cors_origin        = var.cors_origins != "" ? "${local.static_web_app_url},${var.cors_origins}" : local.static_web_app_url
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

# Create Static Web App (Frontend) - created before API to set CORS_ORIGIN
resource "azurerm_static_web_app" "main" {
  name                = "${var.app_name}-web"
  resource_group_name = azurerm_resource_group.main.name
  location            = "West US 2" # Static Web Apps have limited regions
  sku_tier            = "Free"
  sku_size            = "Free"

  tags = var.tags
}

# Create App Service for API
resource "azurerm_linux_web_app" "api" {
  name                = "${var.app_name}-api"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id

  # Ensure Static Web App is created first so we can use its URL for CORS
  depends_on = [azurerm_static_web_app.main]

  site_config {
    always_on = false

    application_stack {
      node_version = "20-lts"
    }

    # Health check configuration
    health_check_path                 = "/api/health"
    health_check_eviction_time_in_min = 2

    # Startup command for Node.js app
    app_command_line = "node index.js"
  }

  app_settings = merge(
    {
      DATABASE_URL = local.database_url
      JWT_SECRET   = random_password.jwt_secret.result
      NODE_ENV     = var.environment
      PORT         = "8080"
      CORS_ORIGIN  = local.cors_origin
    },
    var.create_storage_account ? {
      STORAGE_TYPE                    = "azure"
      AZURE_STORAGE_CONNECTION_STRING = azurerm_storage_account.main[0].primary_connection_string
      AZURE_STORAGE_ACCOUNT_NAME      = azurerm_storage_account.main[0].name
      AZURE_STORAGE_CONTAINER_NAME    = azurerm_storage_container.receipts[0].name
      } : {
      STORAGE_TYPE = "local"
    }
  )

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
  count            = var.db_allow_all_ips ? 1 : 0
  name             = "AllowAll"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"
}

# PostgreSQL Firewall Rule - Allow Specific IPs
resource "azurerm_postgresql_flexible_server_firewall_rule" "allowed_ips" {
  for_each         = toset(var.db_allowed_ips)
  name             = "AllowIP-${replace(each.value, ".", "-")}"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = each.value
  end_ip_address   = each.value
}

# Random JWT secret
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
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

# Storage Account for file uploads
resource "azurerm_storage_account" "main" {
  count                    = var.create_storage_account ? 1 : 0
  name                     = "${replace(var.app_name, "-", "")}storage${substr(md5("${var.app_name}${var.environment}"), 0, 8)}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  tags = var.tags
}

resource "azurerm_storage_container" "receipts" {
  count                 = var.create_storage_account ? 1 : 0
  name                  = "receipts"
  storage_account_name  = azurerm_storage_account.main[0].name
  container_access_type = "private"
}

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