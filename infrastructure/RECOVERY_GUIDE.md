# Azure Deployment Recovery Guide

## If Deployment Fails

### Quick Cleanup and Retry

If your deployment fails and creates partial resources, use the cleanup script:

```powershell
# From infrastructure/scripts directory
.\cleanup.ps1
```

This will:

1. Delete the resource group `grouppay-rg` and ALL resources inside it
2. Clean up local Terraform state files
3. Allow you to start fresh

### Manual Cleanup (Alternative)

If you prefer to clean up manually:

```powershell
# Delete the main resource group (contains all app resources)
az group delete --name grouppay-rg --yes

# Optionally, delete the Terraform backend resource group
# (Only do this if you want to start completely from scratch)
az group delete --name grouppay-terraform-rg --yes

# Clean local Terraform files
cd infrastructure/terraform
Remove-Item -Recurse -Force .terraform
Remove-Item -Force *.tfstate*
Remove-Item -Force tfplan
Remove-Item -Force .terraform.lock.hcl
```

### Check What Exists

```powershell
# List all resource groups
az group list --output table

# Check specific resource group
az group show --name grouppay-rg

# List resources in a group
az resource list --resource-group grouppay-rg --output table
```

## Current Configuration

Your setup from `setup-simple.ps1`:

```
AZURE_SUBSCRIPTION_ID=<from infrastructure/.env>
AZURE_TENANT_ID=<from infrastructure/.env>
AZURE_CLIENT_ID=<from infrastructure/.env>
AZURE_CLIENT_SECRET=<from infrastructure/.env>
TERRAFORM_STORAGE_ACCOUNT=<from infrastructure/.env>
```

✅ Already saved to: `infrastructure/.env`
✅ Already updated in: `infrastructure/terraform/main.tf`

## Next Steps to Deploy

### Option 1: Use Quick Start (Recommended)

```powershell
cd infrastructure/scripts
.\quick-start.ps1
```

### Option 2: Manual Terraform Deployment

```powershell
# Set environment variables for Terraform (get values from infrastructure/.env)
$env:ARM_CLIENT_ID = "<your-client-id>"
$env:ARM_CLIENT_SECRET = "<your-client-secret>"
$env:ARM_SUBSCRIPTION_ID = "<your-subscription-id>"
$env:ARM_TENANT_ID = "<your-tenant-id>"

# Navigate to terraform directory
cd infrastructure/terraform

# Initialize Terraform (connects to Azure backend)
terraform init

# Review what will be created
terraform plan

# Deploy the infrastructure
terraform apply
```

## Cost Monitoring

### Set Up Billing Alerts

```powershell
# Create a budget alert for $50/month
az consumption budget create \
  --name "grouppay-monthly-budget" \
  --amount 50 \
  --time-grain Monthly \
  --start-date $(Get-Date -Format "yyyy-MM-01") \
  --end-date $(Get-Date -Date (Get-Date).AddYears(1) -Format "yyyy-MM-dd")
```

### Check Current Costs

```powershell
# View current month costs
az consumption usage list --start-date $(Get-Date -Format "yyyy-MM-01")

# Or visit Azure Portal
start https://portal.azure.com/#blade/Microsoft_Azure_CostManagement/Menu/costanalysis
```

## Troubleshooting

### "Subscription not found" Error

- Run `az login` again
- Verify subscription: `az account show`

### "Storage account not found" Error

- Check the storage account name in `main.tf` matches the one from setup
- Verify it exists: `az storage account show --name grouppayterraformstate804593 --resource-group grouppay-terraform-rg`

### Terraform Init Fails

- Check your ARM credentials are set (see Option 2 above)
- Verify backend storage account exists
- Try: `terraform init -reconfigure`

### Resource Already Exists

- Someone may have partially deployed with the same name
- Either clean up and retry, or change `app_name` in `terraform.tfvars`

## Emergency: Delete Everything

```powershell
# Delete ALL resource groups (both app and terraform backend)
az group delete --name grouppay-rg --yes --no-wait
az group delete --name grouppay-terraform-rg --yes --no-wait

# Delete service principal (get ID from infrastructure/.env)
az ad sp delete --id <your-client-id>

# Start over from scratch
cd infrastructure/scripts
.\setup-simple.ps1
# Then update .env and main.tf with new values
```
