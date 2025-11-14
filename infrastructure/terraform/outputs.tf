output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "api_deployment_info" {
  description = "API will be deployed via Static Web App backend configuration or GitHub Actions"
  value       = "Deploy API using: 'npm run deploy' or GitHub Actions workflow"
}

output "static_web_app_name" {
  description = "Name of the Static Web App"
  value       = azurerm_static_web_app.main.name
}

output "static_web_app_url" {
  description = "URL of the Static Web App"
  value       = "https://${azurerm_static_web_app.main.default_host_name}"
}

output "database_host" {
  description = "PostgreSQL server hostname"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "database_name" {
  description = "PostgreSQL database name"
  value       = azurerm_postgresql_flexible_server_database.main.name
}

output "database_username" {
  description = "PostgreSQL admin username"
  value       = var.db_admin_username
  sensitive   = true
}

output "database_password" {
  description = "PostgreSQL admin password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "database_url" {
  description = "Complete database connection string"
  value       = local.database_url
  sensitive   = true
}

output "app_service_name" {
  description = "Name of the App Service"
  value       = azurerm_linux_web_app.api.name
}

output "app_service_url" {
  description = "Full HTTPS URL of the App Service"
  value       = "https://${azurerm_linux_web_app.api.default_hostname}"
}

output "app_service_default_hostname" {
  description = "Default hostname of the App Service"
  value       = azurerm_linux_web_app.api.default_hostname
}

output "jwt_secret" {
  description = "JWT secret for authentication"
  value       = random_password.jwt_secret.result
  sensitive   = true
}

output "static_web_app_deployment_token" {
  description = "Deployment token for Static Web App"
  value       = azurerm_static_web_app.main.api_key
  sensitive   = true
}

output "storage_account_name" {
  description = "Name of the Storage Account (if created)"
  value       = var.create_storage_account ? azurerm_storage_account.main[0].name : null
}

output "storage_account_connection_string" {
  description = "Connection string for the Storage Account (if created)"
  value       = var.create_storage_account ? azurerm_storage_account.main[0].primary_connection_string : null
  sensitive   = true
}

output "storage_container_name" {
  description = "Name of the receipts container (if created)"
  value       = var.create_storage_account ? azurerm_storage_container.receipts[0].name : null
}

output "cors_origin" {
  description = "Configured CORS origin(s) for the API"
  value       = local.cors_origin
}

output "application_insights_id" {
  description = "Application Insights resource ID (if created)"
  value       = var.create_app_insights ? azurerm_application_insights.main[0].id : null
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key (if created)"
  value       = var.create_app_insights ? azurerm_application_insights.main[0].instrumentation_key : null
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Application Insights connection string (if created)"
  value       = var.create_app_insights ? azurerm_application_insights.main[0].connection_string : null
  sensitive   = true
}