# Cleanup Script for Group Pay Azure Resources
# Use this to remove partially created resources if deployment fails

param(
    [switch]$Force,
    [string]$ResourceGroup = "grouppay-rg"
)

Write-Host "Azure Resource Cleanup for Group Pay" -ForegroundColor Cyan
Write-Host ""

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
Write-Host "This will DELETE the following:" -ForegroundColor Yellow
Write-Host "  1. Resource Group: $ResourceGroup (and ALL resources inside)" -ForegroundColor White
Write-Host "  2. Terraform state files (local)" -ForegroundColor White
Write-Host ""

if (-not $Force) {
    Write-Host "WARNING: This action cannot be undone!" -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "Type 'DELETE' to confirm"
    
    if ($confirm -ne "DELETE") {
        Write-Host "Cleanup cancelled" -ForegroundColor Yellow
        exit 0
    }
}

# Check if resource group exists
Write-Host ""
Write-Host "Checking for resource group..." -ForegroundColor Cyan
$rgExists = az group exists --name $ResourceGroup

if ($rgExists -eq "true") {
    Write-Host "Deleting resource group: $ResourceGroup..." -ForegroundColor Yellow
    az group delete --name $ResourceGroup --yes --no-wait
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Resource group deletion started (running in background)" -ForegroundColor Green
        Write-Host "     Check status: az group show --name $ResourceGroup" -ForegroundColor Gray
    } else {
        Write-Host "[ERROR] Failed to delete resource group" -ForegroundColor Red
    }
} else {
    Write-Host "[OK] Resource group not found (already deleted or never created)" -ForegroundColor Green
}

# Clean up Terraform state
Write-Host ""
Write-Host "Cleaning up Terraform files..." -ForegroundColor Cyan
$tfDir = Join-Path (Split-Path $PSScriptRoot -Parent) "terraform"

if (Test-Path $tfDir) {
    Push-Location $tfDir
    
    # Remove state files
    $filesToRemove = @(
        ".terraform",
        "*.tfstate",
        "*.tfstate.backup",
        "tfplan",
        ".terraform.lock.hcl"
    )
    
    foreach ($pattern in $filesToRemove) {
        $files = Get-ChildItem -Path . -Filter $pattern -Recurse -Force -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            Remove-Item $file.FullName -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  Removed: $($file.Name)" -ForegroundColor Gray
        }
    }
    
    Pop-Location
    Write-Host "[OK] Terraform files cleaned" -ForegroundColor Green
} else {
    Write-Host "[OK] Terraform directory not found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Cleanup Summary:" -ForegroundColor Cyan
Write-Host "  - Azure resources: Deletion started (check portal to confirm)" -ForegroundColor White
Write-Host "  - Local Terraform state: Removed" -ForegroundColor White
Write-Host ""
Write-Host "You can now retry deployment by running:" -ForegroundColor Yellow
Write-Host "  .\quick-start.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Or start fresh with new credentials:" -ForegroundColor Yellow
Write-Host "  .\setup-simple.ps1" -ForegroundColor Gray
Write-Host "  (then update main.tf with new storage account name)" -ForegroundColor Gray
Write-Host ""
