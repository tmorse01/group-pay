# Group Pay Azure Infrastructure and Deployment Setup
# Quick Start Script for Windows PowerShell

param(
    [switch]$SetupOnly,
    [switch]$DeployOnly,
    [string]$Location = "West US"
)

Write-Host "Group Pay Azure Deployment Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will help you deploy Group Pay to Azure using:" -ForegroundColor White
Write-Host "- Azure App Service (API) - ~`$13/month" -ForegroundColor White
Write-Host "- PostgreSQL Flexible Server - ~`$12/month" -ForegroundColor White
Write-Host "- Azure Static Web App (Frontend) - Free" -ForegroundColor White
Write-Host "- Total estimated cost: ~`$25-35/month" -ForegroundColor White
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Azure CLI
try {
    $null = az --version 2>$null
    Write-Host "[OK] Azure CLI found" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Azure CLI not found" -ForegroundColor Red
    Write-Host "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check Terraform
try {
    $null = terraform --version 2>$null
    Write-Host "[OK] Terraform found" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Terraform not found" -ForegroundColor Red
    Write-Host "Install from: https://www.terraform.io/downloads" -ForegroundColor Yellow
    exit 1
}

# Check Azure login
try {
    $account = az account show --output json 2>$null | ConvertFrom-Json
    Write-Host "[OK] Logged into Azure as: $($account.user.name)" -ForegroundColor Green
    Write-Host "     Subscription: $($account.name)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Not logged into Azure" -ForegroundColor Red
    Write-Host "Run: az login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Run initial setup unless DeployOnly
if (-not $DeployOnly) {
    Write-Host "Running initial Azure setup..." -ForegroundColor Cyan
    Write-Host ""
    
    $setupScript = Join-Path $PSScriptRoot "setup-simple.ps1"
    if (Test-Path $setupScript) {
        & $setupScript -Location $Location
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "[ERROR] Setup failed" -ForegroundColor Red
            exit 1
        }
        
        Write-Host ""
        Write-Host "[OK] Initial setup completed" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Setup script not found: $setupScript" -ForegroundColor Red
        exit 1
    }
}

if ($SetupOnly) {
    Write-Host ""
    Write-Host "Setup complete! Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review infrastructure/terraform/terraform.tfvars" -ForegroundColor White
    Write-Host "2. Update passwords in infrastructure/.env" -ForegroundColor White
    Write-Host "3. Run this script with -DeployOnly to deploy infrastructure" -ForegroundColor White
    exit 0
}

# Check if terraform.tfvars exists
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$tfVarsPath = Join-Path $repoRoot "infrastructure\terraform\terraform.tfvars"
$tfVarsExample = Join-Path $repoRoot "infrastructure\terraform\terraform.tfvars.example"

if (-not (Test-Path $tfVarsPath)) {
    Write-Host ""
    Write-Host "Creating terraform.tfvars from template..." -ForegroundColor Yellow
    
    if (Test-Path $tfVarsExample) {
        Copy-Item $tfVarsExample $tfVarsPath
        Write-Host ""
        Write-Host "Please review and customize: $tfVarsPath" -ForegroundColor Yellow
        Write-Host "Key settings to review:" -ForegroundColor White
        Write-Host "  - app_name (default: grouppay)" -ForegroundColor Gray
        Write-Host "  - location (default: West US)" -ForegroundColor Gray
        Write-Host "  - resource tiers for cost optimization" -ForegroundColor Gray
        Write-Host ""
        Read-Host "Press Enter to continue after reviewing (or Ctrl+C to cancel)"
    } else {
        Write-Host "[ERROR] Template not found: $tfVarsExample" -ForegroundColor Red
        exit 1
    }
}

# Deploy unless SetupOnly
if (-not $SetupOnly) {
    Write-Host ""
    Write-Host "Deploying infrastructure..." -ForegroundColor Cyan
    Write-Host ""
    
    $deployScript = Join-Path $PSScriptRoot "deploy.ps1"
    if (Test-Path $deployScript) {
        & $deployScript
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
            exit 1
        }
        
        Write-Host ""
        Write-Host "[OK] Infrastructure deployment completed" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Deploy script not found: $deployScript" -ForegroundColor Red
        exit 1
    }
}

# Success message
Write-Host ""
Write-Host "Azure Infrastructure Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "What's been created:" -ForegroundColor Cyan
Write-Host "- Resource Group with all Azure resources" -ForegroundColor White
Write-Host "- App Service for your API (Fastify backend)" -ForegroundColor White
Write-Host "- PostgreSQL database for data storage" -ForegroundColor White
Write-Host "- Static Web App for your React frontend" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up GitHub Actions for automatic deployments" -ForegroundColor White
Write-Host "   - Add the secrets from .env.azure to your GitHub repository" -ForegroundColor Gray
Write-Host "   - Push your code to trigger the deployment workflows" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure your applications" -ForegroundColor White
Write-Host "   - API will use the DATABASE_URL from .env.azure" -ForegroundColor Gray
Write-Host "   - Frontend will use the VITE_API_URL for API calls" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Monitor your deployment" -ForegroundColor White
Write-Host "   - Check Azure Portal for resource status" -ForegroundColor Gray
Write-Host "   - Set up billing alerts to monitor costs" -ForegroundColor Gray
Write-Host "   - Use Application Insights for monitoring (optional)" -ForegroundColor Gray
Write-Host ""
Write-Host "Estimated monthly cost: ~`$25-35 USD" -ForegroundColor Yellow
Write-Host ""
Write-Host "Useful links:" -ForegroundColor Cyan
Write-Host "- Azure Portal: https://portal.azure.com" -ForegroundColor White
Write-Host "- GitHub Actions setup: See .github/workflows/ directory" -ForegroundColor White
Write-Host ""
Write-Host "For detailed information, see:" -ForegroundColor Cyan
Write-Host "- DEPLOYMENT_CHECKLIST.md" -ForegroundColor White
Write-Host "- infrastructure/README.md" -ForegroundColor White
Write-Host "- docs/deployment/AZURE_TERRAFORM_DEPLOYMENT.md" -ForegroundColor White
Write-Host ""
