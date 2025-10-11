# Group Pay Azure Deployment

This directory contains the infrastructure as code and deployment scripts for deploying Group Pay to Azure.

## 📁 Structure

```
infrastructure/
├── terraform/                # Terraform configuration files
│   ├── main.tf               # Main infrastructure definition
│   ├── variables.tf          # Input variables
│   ├── outputs.tf            # Output values
│   └── terraform.tfvars      # Environment-specific values
├── scripts/                  # Deployment scripts
│   ├── setup.sh             # Initial Azure setup (Bash)
│   ├── setup.ps1            # Initial Azure setup (PowerShell)
│   ├── deploy.sh            # Deploy infrastructure (Bash)
│   └── deploy.ps1           # Deploy infrastructure (PowerShell)
├── .env.example             # Environment variables template
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Azure CLI**: Install and login with `az login`
2. **Terraform**: Install Terraform 1.0+
3. **PowerShell** (Windows) or **Bash** (Linux/macOS)

### Step 1: Initial Setup

Run the setup script to create Azure resources for Terraform state management:

**Windows (PowerShell):**

```powershell
cd infrastructure/scripts
./setup.ps1
```

**Linux/macOS (Bash):**

```bash
cd infrastructure/scripts
chmod +x setup.sh
./setup.sh
```

This script will:

- Create a resource group for Terraform state
- Create a storage account for Terraform backend
- Create a service principal for authentication
- Generate environment configuration files

### Step 2: Configure Variables

1. Copy the Terraform variables template:

   ```bash
   cd infrastructure/terraform
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` to customize your deployment:
   - Application name
   - Azure region
   - Resource SKUs (for cost optimization)
   - Optional features

3. Review and update `infrastructure/.env` with secure passwords

### Step 3: Deploy Infrastructure

Run the deployment script:

**Windows (PowerShell):**

```powershell
cd infrastructure/scripts
./deploy.ps1
```

**Linux/macOS (Bash):**

```bash
cd infrastructure/scripts
chmod +x deploy.sh
./deploy.sh
```

This will:

- Initialize Terraform with remote state
- Plan and apply the infrastructure
- Create all Azure resources
- Generate application environment files

## 🏗️ Architecture

The infrastructure creates a cost-optimized deployment:

- **Frontend**: Azure Static Web App (Free tier)
- **Backend**: Azure App Service Basic B1 (~$13/month)
- **Database**: PostgreSQL Flexible Server B1ms (~$12/month)
- **Estimated Cost**: ~$25-35/month

### Core Resources

1. **Resource Group**: Contains all resources
2. **App Service Plan**: Basic B1 for the API
3. **Linux Web App**: Hosts the Fastify API
4. **PostgreSQL Flexible Server**: Database with 32GB storage
5. **Static Web App**: Hosts the React frontend

### Optional Resources (Disabled by Default)

- **Key Vault**: For secure secret management (+$1/month)
- **Storage Account**: For file uploads (+$2-5/month)
- **Application Insights**: For monitoring (+$2-5/month)

Enable these by setting the corresponding variables to `true` in `terraform.tfvars`.

## 🔧 Configuration

### Terraform Variables

Key variables in `terraform.tfvars`:

```hcl
# Application Configuration
app_name    = "grouppay"
environment = "production"
location    = "West US"

# Cost Optimization
app_service_sku = "B1"              # Basic tier
db_sku_name     = "B_Standard_B1ms" # Burstable tier

# Optional Features
create_key_vault       = false  # Enable for production
create_storage_account = false  # Enable for file uploads
create_app_insights    = false  # Enable for monitoring
```

### Environment Variables

The deployment creates `.env.azure` with all necessary configuration:

```bash
# API Configuration
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
NODE_ENV="production"

# Frontend Configuration
VITE_API_URL="https://your-api.azurewebsites.net"

# Deployment Configuration
AZURE_RESOURCE_GROUP="grouppay-rg"
AZURE_APP_SERVICE_NAME="grouppay-api"
```

## 🚀 CI/CD Setup

The repository includes GitHub Actions workflows for automatic deployment:

### GitHub Secrets Required

Add these secrets to your GitHub repository settings:

```
# Azure Authentication
ARM_CLIENT_ID=your-service-principal-id
ARM_CLIENT_SECRET=your-service-principal-secret
ARM_SUBSCRIPTION_ID=your-azure-subscription-id
ARM_TENANT_ID=your-azure-tenant-id

# Application Deployment
AZURE_RESOURCE_GROUP=grouppay-rg
AZURE_APP_SERVICE_NAME=grouppay-api
AZURE_APP_SERVICE_PUBLISH_PROFILE=<download-from-azure-portal>
AZURE_STATIC_WEB_APPS_API_TOKEN=<from-terraform-output>
VITE_API_URL=https://your-api.azurewebsites.net
```

### Workflows

1. **Infrastructure** (`.github/workflows/infrastructure.yml`):
   - Validates Terraform on PRs
   - Deploys infrastructure on main branch

2. **API Deployment** (`.github/workflows/deploy-api.yml`):
   - Builds and tests the API
   - Deploys to Azure App Service
   - Runs database migrations

3. **Frontend Deployment** (`.github/workflows/deploy-web.yml`):
   - Builds the React app
   - Deploys to Azure Static Web App

## 💰 Cost Management

### Monthly Cost Breakdown

**Minimal Setup (~$25/month)**:

- App Service B1: ~$13
- PostgreSQL B1ms: ~$12
- Static Web App: Free

**With Optional Services (~$30-35/month)**:

- Add Key Vault: +$1
- Add Storage Account: +$2-5
- Add Application Insights: +$2-5

### Cost Optimization Tips

1. **Start Minimal**: Deploy only required resources initially
2. **Monitor Usage**: Set up billing alerts in Azure Portal
3. **Scale Gradually**: Upgrade tiers only when needed
4. **Development Strategy**: Use local development, single production environment

## 🔒 Security

### Default Security Configuration

- Database accessible from Azure services only
- HTTPS enforced on all endpoints
- Environment variables for sensitive data
- CORS configured for frontend domain

### Production Security Recommendations

1. **Enable Key Vault**: For centralized secret management
2. **Database Firewall**: Restrict to specific IP ranges
3. **Network Security**: Consider VNet integration
4. **Regular Updates**: Keep all dependencies current

## 📊 Monitoring

### Built-in Monitoring

- App Service logs and metrics
- PostgreSQL performance insights
- Static Web App deployment logs

### Optional Application Insights

Enable comprehensive monitoring by setting `create_app_insights = true`:

- Application performance monitoring
- Custom telemetry and analytics
- Error tracking and alerting
- User behavior insights

## 🔧 Maintenance

### Regular Tasks

**Weekly**:

- Check error logs
- Monitor costs
- Review security alerts

**Monthly**:

- Update dependencies
- Review resource utilization
- Backup verification

### Common Operations

**View Terraform Outputs**:

```bash
cd infrastructure/terraform
terraform output
```

**Update Infrastructure**:

```bash
# Modify terraform.tfvars
terraform plan
terraform apply
```

**Scale Resources**:

```bash
# Update app_service_sku or db_sku_name in terraform.tfvars
terraform plan
terraform apply
```

## 🆘 Troubleshooting

### Common Issues

**Terraform Backend Issues**:

- Verify storage account exists
- Check authentication credentials
- Ensure storage account name is unique

**Deployment Failures**:

- Check Azure CLI authentication
- Verify service principal permissions
- Review resource naming conflicts

**Application Issues**:

- Check App Service logs
- Verify database connectivity
- Validate environment variables

### Getting Help

1. Check Azure Portal for resource status
2. Review GitHub Actions workflow logs
3. Use `terraform plan` to preview changes
4. Check Azure CLI with `az account show`

## 🔄 Cleanup

To delete all resources and avoid charges:

```bash
cd infrastructure/terraform
terraform destroy
```

This will remove all resources except the Terraform state storage account, which should be deleted manually from the Azure Portal.

---

For detailed deployment instructions, see the main [Azure Terraform Deployment Guide](../docs/deployment/AZURE_TERRAFORM_DEPLOYMENT.md).
