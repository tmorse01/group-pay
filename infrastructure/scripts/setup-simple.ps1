# Simple Azure Setup for Group Pay
param([string]$Location = "West US")

Write-Host "Azure Setup for Group Pay" -ForegroundColor Cyan
Write-Host ""

# Check Azure login
try {
    $sub = az account show --output json | ConvertFrom-Json
    Write-Host "[OK] Logged in as: $($sub.user.name)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Run: az login" -ForegroundColor Red
    exit 1
}

Write-Host "Creating Terraform backend..." -ForegroundColor Cyan
$rg = "grouppay-terraform-rg"
$storage = "grouppayterraformstate$(Get-Random -Minimum 100000 -Maximum 999999)"

az group create --name $rg --location $Location --output none
az storage account create --name $storage --resource-group $rg --location $Location --sku Standard_LRS --output none

$key = az storage account keys list --resource-group $rg --account-name $storage --query '[0].value' -o tsv
az storage container create --name terraform-state --account-name $storage --account-key $key --output none

Write-Host "Creating service principal..." -ForegroundColor Cyan
$sp = az ad sp create-for-rbac --name "grouppay-sp-$(Get-Random)" --role Contributor --scopes "/subscriptions/$($sub.id)" --output json | ConvertFrom-Json

Write-Host ""
Write-Host "[OK] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Save these credentials:" -ForegroundColor Yellow
Write-Host "AZURE_SUBSCRIPTION_ID=$($sub.id)"
Write-Host "AZURE_TENANT_ID=$($sp.tenant)"
Write-Host "AZURE_CLIENT_ID=$($sp.appId)"
Write-Host "AZURE_CLIENT_SECRET=$($sp.password)"
Write-Host "TERRAFORM_STORAGE_ACCOUNT=$storage"
Write-Host ""
Write-Host "Update main.tf with storage account name: $storage" -ForegroundColor Yellow
