# Group Pay Azure Deployment Guide

Complete guide for deploying Group Pay to Azure using Terraform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Infrastructure Deployment](#infrastructure-deployment)
4. [Application Deployment](#application-deployment)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Maintenance](#maintenance)

## Prerequisites

### Required Tools

- **Azure CLI** (v2.50+): `az --version`
- **Terraform** (v1.0+): `terraform --version`
- **Node.js** (18+): `node --version`
- **pnpm** (8+): `pnpm --version`
- **Git**: `git --version`

### Azure Account Setup

1. **Azure Account** with active subscription
2. **Azure CLI Login**:

   ```bash
   az login
   az account show  # Verify current subscription
   ```

3. **Service Principal** (for automation):

   ```bash
   az ad sp create-for-rbac --name "group-pay-terraform" \
     --role="Contributor" \
     --scopes="/subscriptions/{subscription-id}"
   ```

   Save the output credentials securely.

## Initial Setup

### 1. Clone and Navigate

```bash
cd infrastructure/terraform
```

### 2. Configure Terraform Variables

Copy the example variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your configuration:

```hcl
app_name    = "grouppay"
environment = "production"
location    = "West US"

# App Service Configuration
app_service_sku = "B1"  # Basic tier (~$13/month) or "F1" for free tier

# Database Configuration
db_admin_username = "grouppay_admin"
db_name          = "grouppay"
db_sku_name      = "B_Standard_B1ms"
db_storage_mb    = 32768

# Optional Features
create_storage_account = true   # Enable for file uploads
create_key_vault       = false  # Enable for production secrets
create_app_insights    = false  # Enable for monitoring

# Database Firewall (Security)
db_allow_all_ips = false        # Set to true only for development
db_allowed_ips   = []           # Add specific IPs: ["1.2.3.4", "5.6.7.8"]
```

### 3. Set Azure Credentials

**Windows PowerShell:**

```powershell
$env:ARM_CLIENT_ID = "your-client-id"
$env:ARM_CLIENT_SECRET = "your-client-secret"
$env:ARM_SUBSCRIPTION_ID = "your-subscription-id"
$env:ARM_TENANT_ID = "your-tenant-id"
```

**Linux/macOS:**

```bash
export ARM_CLIENT_ID="your-client-id"
export ARM_CLIENT_SECRET="your-client-secret"
export ARM_SUBSCRIPTION_ID="your-subscription-id"
export ARM_TENANT_ID="your-tenant-id"
```

## Infrastructure Deployment

### Option 1: Using Deployment Scripts (Recommended)

**Windows:**

```powershell
cd infrastructure/scripts
.\deploy.ps1
```

**Linux/macOS:**

```bash
cd infrastructure/scripts
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Terraform Deployment

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Preview changes
terraform plan

# Apply infrastructure
terraform apply
```

Review the plan carefully and type `yes` to confirm.

### 4. Save Deployment Outputs

After successful deployment:

```bash
# View all outputs
terraform output

# Save outputs to file
terraform output -json > outputs.json

# View specific outputs
terraform output app_service_url
terraform output database_url
terraform output static_web_app_deployment_token
```

The deployment scripts automatically save outputs to `infrastructure/.env.azure`.

## Application Deployment

### 1. Get App Service Publish Profile

Download the publish profile from Azure Portal:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your App Service (`grouppay-api`)
3. Click **Get publish profile**
4. Save the `.PublishSettings` file

**Or use Azure CLI:**

```bash
az webapp deployment list-publishing-profiles \
  --name grouppay-api \
  --resource-group grouppay-rg \
  --xml > publish-profile.xml
```

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

Required secrets:

```
ARM_CLIENT_ID=<from service principal>
ARM_CLIENT_SECRET=<from service principal>
ARM_SUBSCRIPTION_ID=<your subscription ID>
ARM_TENANT_ID=<your tenant ID>

AZURE_RESOURCE_GROUP=grouppay-rg
AZURE_APP_SERVICE_NAME=grouppay-api
AZURE_APP_SERVICE_PUBLISH_PROFILE=<paste entire publish profile XML>
AZURE_STATIC_WEB_APPS_API_TOKEN=<from terraform output>
VITE_API_URL=<from terraform output - app_service_url>
```

### 3. Deploy via GitHub Actions

Push to main branch to trigger automatic deployment:

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

Or manually trigger:

- Go to **Actions** tab in GitHub
- Select **Deploy API to Azure App Service**
- Click **Run workflow**

### 4. Manual API Deployment (Alternative)

If not using GitHub Actions:

```bash
cd apps/api

# Install dependencies
pnpm install

# Build application
pnpm build

# Create deployment package
cd dist
zip -r ../api-deployment.zip .

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group grouppay-rg \
  --name grouppay-api \
  --src api-deployment.zip
```

### 5. Run Database Migrations

```bash
cd apps/api

# Set database URL
export DATABASE_URL="<from terraform output>"

# Run migrations
npx prisma migrate deploy

# Optional: Seed database
npx prisma db seed
```

### 6. Deploy Frontend

The frontend deploys automatically via GitHub Actions when you push to main.

**Manual deployment:**

```bash
cd apps/web

# Set API URL
export VITE_API_URL="<from terraform output>"

# Build
pnpm build

# Deploy using Static Web Apps CLI or GitHub Actions
```

## Post-Deployment Configuration

### 1. Verify App Service is Running

```bash
# Check App Service status
az webapp show --name grouppay-api --resource-group grouppay-rg

# View logs
az webapp log tail --name grouppay-api --resource-group grouppay-rg

# Test health endpoint
curl https://grouppay-api.azurewebsites.net/api/health
```

### 2. Verify Database Connection

```bash
# Test connection
psql "postgresql://grouppay_admin:PASSWORD@grouppay-postgres.postgres.database.azure.com:5432/grouppay?sslmode=require"

# Check migrations
cd apps/api
npx prisma migrate status
```

### 3. Configure CORS

CORS is automatically configured via `CORS_ORIGIN` environment variable in App Service.

Verify in Azure Portal:

1. App Service → Configuration → Application settings
2. Check `CORS_ORIGIN` matches your Static Web App URL

### 4. Enable Storage Account (if needed)

If you enabled storage account:

1. Verify container exists:

   ```bash
   az storage container show \
     --name receipts \
     --account-name <storage-account-name>
   ```

2. Verify App Service has connection string:
   - App Service → Configuration → Application settings
   - Check `AZURE_STORAGE_CONNECTION_STRING` is set

## Troubleshooting

### App Service Not Starting

**Error: Database connection string invalid**

This is fixed in the current Terraform configuration. If you still see this:

1. Check App Service logs:

   ```bash
   az webapp log tail --name grouppay-api --resource-group grouppay-rg
   ```

2. Verify DATABASE_URL format:
   - Should include `?sslmode=require`
   - Password should be URL-encoded
   - Port should be `5432`

3. Re-apply Terraform:
   ```bash
   cd infrastructure/terraform
   terraform apply
   ```

**Error: Port already in use**

Azure App Service uses port 8080. Verify your app uses:

```typescript
const PORT = process.env.PORT || 8080;
```

### Database Connection Issues

**Cannot connect to database:**

1. Check firewall rules:

   ```bash
   az postgres flexible-server firewall-rule list \
     --resource-group grouppay-rg \
     --name grouppay-postgres
   ```

2. Add your IP if needed:

   ```bash
   az postgres flexible-server firewall-rule create \
     --resource-group grouppay-rg \
     --name grouppay-postgres \
     --rule-name AllowMyIP \
     --start-ip-address YOUR_IP \
     --end-ip-address YOUR_IP
   ```

3. Verify "AllowAzureServices" rule exists (0.0.0.0-0.0.0.0)

### Storage Account Issues

**File uploads failing:**

1. Verify storage account exists:

   ```bash
   az storage account show \
     --name <storage-account-name> \
     --resource-group grouppay-rg
   ```

2. Check container exists:

   ```bash
   az storage container show \
     --name receipts \
     --account-name <storage-account-name>
   ```

3. Verify connection string in App Service settings

### GitHub Actions Deployment Failures

**Workflow fails:**

1. Check workflow logs in GitHub Actions tab
2. Verify all secrets are set correctly
3. Check publish profile is valid XML
4. Ensure App Service name matches secret

**Common issues:**

- Missing `AZURE_APP_SERVICE_PUBLISH_PROFILE` secret
- Invalid `VITE_API_URL` format (should be full URL with https://)
- Missing `AZURE_STATIC_WEB_APPS_API_TOKEN`

## Maintenance

### Update Infrastructure

```bash
cd infrastructure/terraform

# Modify terraform.tfvars or main.tf
# Preview changes
terraform plan

# Apply changes
terraform apply
```

### Update Application

Push to main branch - GitHub Actions will automatically deploy.

### Monitor Costs

```bash
# View resource costs
az consumption usage list \
  --start-date $(date -d '1 month ago' +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d)
```

Set up billing alerts in Azure Portal:

1. Cost Management + Billing
2. Budgets → Add
3. Set monthly budget threshold

### Backup Database

Backups are automatically configured (7-day retention).

**Manual backup:**

```bash
az postgres flexible-server backup list \
  --resource-group grouppay-rg \
  --server-name grouppay-postgres
```

### Scale Resources

Update `terraform.tfvars`:

```hcl
# Scale App Service
app_service_sku = "B2"  # Upgrade from B1

# Scale Database
db_sku_name = "B_Standard_B2s"  # Upgrade from B1ms
```

Then apply:

```bash
terraform plan
terraform apply
```

### Clean Up (Destroy Infrastructure)

**Warning: This will delete all resources!**

```bash
cd infrastructure/terraform
terraform destroy
```

## Security Best Practices

### Production Checklist

- [ ] Database firewall restricted (not allowing all IPs)
- [ ] Strong database password (auto-generated by Terraform)
- [ ] JWT secret is secure (auto-generated by Terraform)
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured correctly
- [ ] Storage account uses private containers
- [ ] Key Vault enabled for secrets (optional)
- [ ] Application Insights enabled for monitoring (optional)
- [ ] Billing alerts configured
- [ ] Regular backups verified

### Database Security

**Restrict firewall access:**

```hcl
# In terraform.tfvars
db_allow_all_ips = false
db_allowed_ips   = ["YOUR_IP_ADDRESS"]
```

**Use Key Vault for secrets:**

```hcl
create_key_vault = true
```

### Storage Security

- Storage containers are private by default
- Connection strings stored securely in App Service settings
- Files are served via signed URLs (if implemented)

## Useful Commands Reference

### Terraform

```bash
terraform init          # Initialize providers
terraform plan          # Preview changes
terraform apply         # Deploy infrastructure
terraform destroy       # Remove all resources
terraform output        # View outputs
terraform state list    # List resources
terraform refresh       # Refresh state
```

### Azure CLI

```bash
# App Service
az webapp list --resource-group grouppay-rg
az webapp log tail --name grouppay-api --resource-group grouppay-rg
az webapp restart --name grouppay-api --resource-group grouppay-rg

# Database
az postgres flexible-server show --name grouppay-postgres --resource-group grouppay-rg
az postgres flexible-server firewall-rule list --name grouppay-postgres --resource-group grouppay-rg

# Storage
az storage account list --resource-group grouppay-rg
az storage container list --account-name <storage-account-name>

# General
az resource list --resource-group grouppay-rg --output table
az group show --name grouppay-rg
```

## Support & Resources

- **Azure Portal**: https://portal.azure.com
- **Terraform Azure Provider Docs**: https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs
- **Azure App Service Docs**: https://docs.microsoft.com/azure/app-service/
- **PostgreSQL Flexible Server Docs**: https://docs.microsoft.com/azure/postgresql/flexible-server/
- **Static Web Apps Docs**: https://docs.microsoft.com/azure/static-web-apps/

## Next Steps

After successful deployment:

1. Test all application features
2. Set up monitoring and alerts
3. Configure custom domain (optional)
4. Set up CI/CD for automated deployments
5. Review and optimize costs
6. Implement additional security measures

---

**Last Updated**: November 2025
**Maintained By**: Group Pay Team
