# Group Pay Azure Deployment Status

**Last Updated:** October 11, 2025  
**Status:** Ready for Deployment

---

## What's Been Completed ✅

### 1. Infrastructure Configuration Files

- ✅ **Terraform configuration** created in `infrastructure/terraform/`
  - `main.tf` - Complete Azure resource definitions
  - `variables.tf` - Configuration variables
  - `outputs.tf` - Output values for deployment info
  - `terraform.tfvars.example` - Template for customization

### 2. Deployment Scripts

- ✅ **PowerShell deployment scripts** in `infrastructure/scripts/`
  - `setup-simple.ps1` - Creates Azure backend and service principal
  - `quick-start.ps1` - Main orchestration script
  - `deploy.ps1` - Terraform deployment wrapper
  - `cleanup.ps1` - Emergency cleanup for failed deployments

### 3. CI/CD Workflows

- ✅ **GitHub Actions workflows** in `.github/workflows/`
  - `infrastructure.yml` - Infrastructure deployment
  - `deploy-api.yml` - API application deployment
  - `deploy-web.yml` - Frontend deployment

### 4. Azure Service Principal

- ✅ Created service principal with Contributor role
- ✅ Credentials saved to `infrastructure/.env` (gitignored)
- ✅ Terraform backend configured (using local state temporarily)

### 5. Configuration Fixes Applied

- ✅ Changed App Service Plan from B1 (Basic) to **F1 (Free)** tier to avoid quota issues
- ✅ Removed availability zone specification for PostgreSQL (not available in West US)
- ✅ Disabled `always_on` feature for F1 tier compatibility
- ✅ Configured local Terraform state (Azure storage account had creation issues)

---

## Current Infrastructure State 🔧

**All resources cleaned up and ready for fresh deployment**

- Resource Group: None (cleaned up)
- Terraform State: Clean local state
- Azure Credentials: Valid and configured

---

## Next Steps - Deploy to Azure 🚀

### Step 1: Set Environment Variables

Open PowerShell and run:

```powershell
# Navigate to terraform directory
cd "G:\Code\Current Projects\group-pay\infrastructure\terraform"

# Set Azure credentials (replace with your actual values from infrastructure/.env)
$env:ARM_CLIENT_ID = "your-client-id-here"
$env:ARM_CLIENT_SECRET = "your-client-secret-here"
$env:ARM_SUBSCRIPTION_ID = "your-subscription-id-here"
$env:ARM_TENANT_ID = "your-tenant-id-here"
```

### Step 2: Review and Deploy

```powershell
# Initialize Terraform (if not already done)
terraform init

# Review what will be created
terraform plan

# Deploy the infrastructure
terraform apply
```

**Review the plan carefully before typing `yes` to confirm!**

### Step 3: Save the Deployment Outputs

After successful deployment, Terraform will output important information:

```powershell
# Save outputs to a file
terraform output -json > outputs.json

# View specific outputs
terraform output app_service_url
terraform output database_url
terraform output static_web_app_url
terraform output static_web_app_deployment_token
```

These outputs will be saved to `infrastructure/.env.azure` automatically.

---

## What Will Be Created 📦

### Azure Resources (9 total):

1. **Resource Group** (`grouppay-rg`)
   - Container for all resources
   - Location: West US

2. **App Service Plan** (`grouppay-plan`)
   - Tier: **F1 (Free)** - $0/month
   - OS: Linux
   - Note: Free tier has limitations (no always-on, 60 min/day active)

3. **App Service** (`grouppay-api`)
   - Runtime: Node.js 18 LTS
   - For: Fastify API backend
   - Auto-configured with DATABASE_URL and JWT_SECRET

4. **PostgreSQL Flexible Server** (`grouppay-postgres`)
   - Version: PostgreSQL 15
   - Tier: B_Standard_B1ms - ~$12/month
   - Storage: 32GB
   - Backup: 7-day retention

5. **PostgreSQL Database** (`grouppay`)
   - Charset: UTF-8
   - Collation: en_US.utf8

6. **PostgreSQL Firewall Rules** (2 rules)
   - Allow Azure Services
   - Allow all IPs (development mode - restrict in production!)

7. **Static Web App** (`grouppay-web`)
   - Tier: **Free** - $0/month
   - Location: West US 2
   - For: React frontend (Vite)

8. **Random Passwords** (2 generated)
   - Database admin password (32 chars)
   - JWT secret (64 chars)

### Estimated Monthly Cost: ~$12-15/month

- App Service: **Free**
- PostgreSQL: ~$12/month
- Static Web App: **Free**

---

## After Infrastructure Deployment 🎯

### 1. Configure GitHub Repository Secrets

Add these secrets in GitHub Settings → Secrets and variables → Actions:

```
ARM_CLIENT_ID=<from infrastructure/.env>
ARM_CLIENT_SECRET=<from infrastructure/.env>
ARM_SUBSCRIPTION_ID=<from infrastructure/.env>
ARM_TENANT_ID=<from infrastructure/.env>

AZURE_RESOURCE_GROUP=grouppay-rg
AZURE_APP_SERVICE_NAME=grouppay-api
AZURE_STATIC_WEB_APP_NAME=grouppay-web

# Get these from terraform outputs
AZURE_STATIC_WEB_APPS_API_TOKEN=<from terraform output>
VITE_API_URL=<API URL from terraform output>
```

### 2. Deploy the API Application

```powershell
cd apps/api

# Build the application
pnpm install
pnpm build

# Run Prisma migrations
npx prisma migrate deploy

# Deploy to Azure App Service (manual first time)
az webapp deployment source config-zip `
  --resource-group grouppay-rg `
  --name grouppay-api `
  --src <path-to-api.zip>
```

Or push to GitHub to trigger automatic deployment via GitHub Actions.

### 3. Deploy the Frontend

```powershell
cd apps/web

# Build the application
pnpm install
pnpm build

# Deploy to Static Web App via GitHub Actions
# (push to main branch will trigger deployment)
```

### 4. Run Database Migrations

```powershell
# From apps/api directory
npx prisma migrate deploy
npx prisma db seed  # If you have seed data
```

---

## Known Issues & Limitations ⚠️

### Current Limitations:

1. **Free App Service Tier (F1)**
   - No "always on" - app sleeps after 20 min of inactivity
   - Limited to 60 minutes of active time per day
   - First request after sleep takes ~10-20 seconds
   - **Solution**: Upgrade to B1 tier (~$13/month) when quota is available

2. **Azure Quota Issue**
   - Subscription doesn't have quota for Basic (B1) App Service Plans
   - **Workaround**: Using F1 (Free) tier for now
   - **To fix**: Request quota increase in Azure Portal → Quotas

3. **Terraform Backend**
   - Using **local state** instead of remote Azure Storage
   - **Reason**: Storage account creation failed with subscription errors
   - **Impact**: State file stored locally in `infrastructure/terraform/terraform.tfstate`
   - **Important**: **KEEP THIS FILE SAFE** - it tracks your infrastructure
   - **To migrate to remote**: Uncomment backend block in `main.tf` when storage account is ready

4. **Database Firewall**
   - Currently allows **all IPs** (0.0.0.0-255.255.255.255)
   - **Security Risk**: Development mode only
   - **Production**: Restrict to specific IPs/VNets

---

## Troubleshooting Guide 🔧

### If Deployment Fails:

```powershell
# Clean up partial deployment
cd infrastructure/scripts
.\cleanup.ps1

# Or manually
cd infrastructure/terraform
terraform destroy -auto-approve

# Check what exists
az resource list --resource-group grouppay-rg --output table
```

### If You Need to Start Over:

```powershell
# 1. Clean up everything
cd infrastructure/scripts
.\cleanup.ps1

# 2. Create new service principal (if needed)
.\setup-simple.ps1

# 3. Update credentials in infrastructure/.env

# 4. Update storage account name in main.tf (if using remote backend)

# 5. Redeploy
cd ../terraform
terraform init
terraform apply
```

### Check Azure Portal:

```powershell
# Open Azure Portal
start https://portal.azure.com

# View resource group
az group show --name grouppay-rg

# View App Service
az webapp show --name grouppay-api --resource-group grouppay-rg
```

---

## Important Files 📁

### Keep Safe (NEVER commit to git):

- `infrastructure/.env` - Azure credentials
- `infrastructure/.env.azure` - Deployment outputs
- `infrastructure/terraform/terraform.tfstate` - Infrastructure state
- `infrastructure/terraform/terraform.tfstate.backup` - State backup
- `infrastructure/terraform/.terraform/` - Provider plugins

### Already in .gitignore:

- All `.env*` files
- `*.tfstate*` files
- `.terraform/` directory

---

## Useful Commands 📝

### Terraform:

```powershell
terraform init          # Initialize/update providers
terraform plan          # Preview changes
terraform apply         # Deploy infrastructure
terraform destroy       # Remove all infrastructure
terraform output        # Show outputs
terraform state list    # List tracked resources
```

### Azure CLI:

```powershell
az login                                    # Login to Azure
az account show                             # Show current subscription
az group list --output table                # List resource groups
az resource list -g grouppay-rg --output table  # List resources in group
az webapp log tail --name grouppay-api --resource-group grouppay-rg  # View app logs
```

### Deployment:

```powershell
# API
cd apps/api
pnpm build
az webapp deployment source config-zip --resource-group grouppay-rg --name grouppay-api --src dist.zip

# Frontend (handled by GitHub Actions)
git push origin main
```

---

## Resources & Documentation 📚

- **Azure Portal**: https://portal.azure.com
- **Terraform Documentation**: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs
- **Project Documentation**:
  - `infrastructure/README.md` - Infrastructure overview
  - `DEPLOYMENT_CHECKLIST.md` - Deployment checklist
  - `infrastructure/RECOVERY_GUIDE.md` - Recovery procedures
  - `docs/deployment/AZURE_TERRAFORM_DEPLOYMENT.md` - Detailed deployment guide

---

## Questions or Issues? 💬

1. Check `infrastructure/RECOVERY_GUIDE.md` for common issues
2. Review Terraform error messages carefully
3. Check Azure Portal for resource status
4. Verify credentials in `infrastructure/.env`
5. Ensure you're logged in: `az account show`

---

**Ready to deploy when you are!** 🎉

Just follow the "Next Steps" section above when you're ready to continue.
