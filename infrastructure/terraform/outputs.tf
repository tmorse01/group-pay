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
  value       = "postgresql://${var.db_admin_username}:${random_password.db_password.result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.db_name}?sslmode=require"
  sensitive   = true
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