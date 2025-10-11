# Azure Infrastructure Deployment Script for Group Pay (PowerShell)
# This script deploys the Azure infrastructure using Terraform

param(
    [switch]$AutoApprove,
    [switch]$SkipInit
)

$ErrorActionPreference = "Stop"

Write-Host "Deploying Group Pay Infrastructure" -ForegroundColor Cyan
Write-Host ""

# Navigate to terraform directory
$tfDir = Join-Path (Split-Path $PSScriptRoot -Parent) "terraform"
Push-Location $tfDir

try {
    # Load credentials from setup-simple output
    Write-Host "Looking for Azure credentials..." -ForegroundColor Cyan
    
    # Check if user has set environment variables or use the ones from setup-simple
    if (-not $env:ARM_CLIENT_ID) {
        Write-Host "[WARNING] ARM_CLIENT_ID not set. You need to set the credentials from setup-simple.ps1 output" -ForegroundColor Yellow
        Write-Host "Example:" -ForegroundColor Gray
        Write-Host '  $env:ARM_CLIENT_ID="your-client-id"' -ForegroundColor Gray
        Write-Host '  $env:ARM_CLIENT_SECRET="your-client-secret"' -ForegroundColor Gray
        Write-Host '  $env:ARM_SUBSCRIPTION_ID="your-subscription-id"' -ForegroundColor Gray
        Write-Host '  $env:ARM_TENANT_ID="your-tenant-id"' -ForegroundColor Gray
        Write-Host ""
        $continue = Read-Host "Have you set these environment variables? (y/N)"
        if ($continue -ne 'y' -and $continue -ne 'Y') {
            Write-Host "Deployment cancelled. Please set credentials first." -ForegroundColor Yellow
            exit 1
        }
    }
    
    # Initialize Terraform
    if (-not $SkipInit) {
        Write-Host "Initializing Terraform..." -ForegroundColor Cyan
        terraform init
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Terraform init failed" -ForegroundColor Red
            exit 1
        }
    }
    
    # Validate configuration
    Write-Host ""
    Write-Host "Validating configuration..." -ForegroundColor Cyan
    terraform validate
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Terraform validation failed" -ForegroundColor Red
        exit 1
    }
    
    # Create terraform.tfvars if it doesn't exist
    if (-not (Test-Path "terraform.tfvars")) {
        Write-Host ""
        Write-Host "Creating terraform.tfvars from template..." -ForegroundColor Yellow
        Copy-Item "terraform.tfvars.example" "terraform.tfvars"
        Write-Host "[OK] Created terraform.tfvars - review and customize if needed" -ForegroundColor Green
    }
    
    # Plan the deployment
    Write-Host ""
    Write-Host "Planning infrastructure changes..." -ForegroundColor Cyan
    terraform plan -out=tfplan
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Terraform plan failed" -ForegroundColor Red
        exit 1
    }
    
    # Apply
    Write-Host ""
    if ($AutoApprove) {
        Write-Host "Applying changes automatically..." -ForegroundColor Cyan
        terraform apply tfplan
    } else {
        Write-Host "Review the plan above." -ForegroundColor Yellow
        Write-Host "This will create Azure resources and incur costs (~`$25-35/month)" -ForegroundColor Yellow
        Write-Host ""
        $confirm = Read-Host "Apply these changes? (yes/no)"
        
        if ($confirm -eq "yes") {
            terraform apply tfplan
        } else {
            Write-Host "Deployment cancelled" -ForegroundColor Yellow
            exit 0
        }
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Terraform apply failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "To clean up partial resources, run:" -ForegroundColor Yellow
        Write-Host "  terraform destroy" -ForegroundColor Gray
        Write-Host "Or manually delete in Azure Portal:" -ForegroundColor Yellow
        Write-Host "  az group delete --name grouppay-rg --yes" -ForegroundColor Gray
        exit 1
    }
    
    # Save outputs
    Write-Host ""
    Write-Host "Saving outputs..." -ForegroundColor Cyan
    
    $outputs = terraform output -json | ConvertFrom-Json
    $envFile = Join-Path (Split-Path $tfDir -Parent) ".env.azure"
    
    $envContent = @"
# Azure Infrastructure Outputs - Generated $(Get-Date)
API_URL=$($outputs.app_service_url.value)
WEB_URL=$($outputs.static_web_app_url.value)
DATABASE_URL=$($outputs.database_url.value)
DATABASE_HOST=$($outputs.database_host.value)
RESOURCE_GROUP=$($outputs.resource_group_name.value)
APP_SERVICE_NAME=$($outputs.app_service_name.value)
STATIC_WEB_APP_NAME=$($outputs.static_web_app_name.value)
STATIC_WEB_APP_TOKEN=$($outputs.static_web_app_deployment_token.value)
JWT_SECRET=$($outputs.jwt_secret.value)
"@
    
    Set-Content -Path $envFile -Value $envContent
    Write-Host "[OK] Outputs saved to .env.azure" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "[OK] Infrastructure deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deployment Summary:" -ForegroundColor Cyan
    Write-Host "  Resource Group: $($outputs.resource_group_name.value)" -ForegroundColor White
    Write-Host "  API URL: $($outputs.app_service_url.value)" -ForegroundColor White
    Write-Host "  Web URL: $($outputs.static_web_app_url.value)" -ForegroundColor White
    Write-Host "  Database: $($outputs.database_host.value)" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Deploy API: See .github/workflows/deploy-api.yml" -ForegroundColor White
    Write-Host "2. Deploy Frontend: See .github/workflows/deploy-web.yml" -ForegroundColor White
    Write-Host "3. Run migrations: cd apps/api && npx prisma migrate deploy" -ForegroundColor White
    Write-Host ""
    
} finally {
    Pop-Location
}