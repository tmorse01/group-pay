# Azure Deployment Guide with Terraform

A cost-optimized deployment guide for deploying the Group Pay application to Azure using Terraform. This guide prioritizes affordability for hobby projects while maintaining good practices.

## 📋 Table of Contents

1. [Cost-Optimized Architecture](#cost-optimized-architecture)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Strategy](#infrastructure-strategy)
4. [Deployment Process](#deployment-process)
5. [Cost Management](#cost-management)
6. [Monitoring Essentials](#monitoring-essentials)
7. [Maintenance](#maintenance)

## 🏗️ Cost-Optimized Architecture

**Single Environment Strategy** - Start with production only, add staging later if needed.

### Minimal Production Architecture

```
┌─────────────────────┐
│   Static Web App    │ <- React Frontend (FREE tier)
│     (React SPA)     │
└─────────┬───────────┘
          │ HTTPS/API calls
┌─────────▼───────────┐
│     App Service     │ <- Fastify API (B1 Basic ~$13/mo)
│      (Node.js)      │
└─────────┬───────────┘
          │ Connection
┌─────────▼───────────┐
│   PostgreSQL        │ <- Database (B1ms ~$12/mo)
│  (Flexible Server)  │
└─────────────────────┘

Optional (add later):
├─ Key Vault (secrets) - $1/mo
├─ Storage Account (files) - $2-5/mo
└─ Application Insights - $2-5/mo
```

**Total Estimated Cost: ~$25-35/month**

### Service Choices for Cost Optimization

- **Frontend**: Azure Static Web Apps (Free tier) - $0
- **Backend**: App Service Basic B1 - ~$13/month
- **Database**: PostgreSQL Flexible Server B1ms - ~$12/month
- **Storage**: Standard LRS - ~$2-5/month (when needed)
- **Monitoring**: Basic Application Insights - ~$2-5/month (when needed)

### Environment Strategy

- **Development**: Local with Docker Compose (existing setup)
- **Production**: Single Azure environment initially
- **Staging**: Add later when growth justifies the cost

## 📋 Prerequisites

### Required Tools

1. **Azure CLI** - `az --version`
2. **Terraform** (v1.0+) - `terraform --version`
3. **Node.js** (18+) and **pnpm** - Already installed in your project

### Azure Setup

1. **Azure Account** with active subscription
2. **Service Principal** for automation:
   ```bash
   az login
   az ad sp create-for-rbac --name "group-pay-terraform" --role="Contributor" --scopes="/subscriptions/{subscription-id}"
   ```
3. **Resource Naming**: `grouppay-{environment}-{resource-type}`

## 🏗️ Infrastructure Strategy

### Directory Structure

```
infrastructure/
├── terraform/
│   ├── main.tf              # Single-file approach for simplicity
│   ├── variables.tf         # Input variables
│   ├── outputs.tf           # Resource outputs
│   └── terraform.tfvars     # Environment values
├── scripts/
│   ├── setup.sh            # Initial Azure setup
│   └── deploy.sh           # Deploy infrastructure
└── .env.example            # Environment template
```

### Key Terraform Resources

**Core Resources** (implement in `main.tf`):

- Resource Group
- App Service Plan (Basic B1)
- Linux Web App (Node.js API)
- PostgreSQL Flexible Server (B1ms)
- Static Web App (Free tier)

**Optional Resources** (add when needed):

- Key Vault (for secrets)
- Storage Account (for file uploads)
- Application Insights (for monitoring)

### Resource Configuration Guidelines

**App Service Plan**:

- SKU: `B1` (Basic tier - $13/month)
- OS: Linux
- Auto-scaling: Disabled initially

**PostgreSQL**:

- SKU: `B_Standard_B1ms` (Burstable - $12/month)
- Storage: 32GB initially
- Backup retention: 7 days
- No geo-redundancy

**Static Web App**:

- SKU: `Free` tier
- GitHub integration for auto-deployment

## 🚀 Deployment Process

### Phase 1: Initial Setup

1. **Create Infrastructure Directory**

   ```bash
   mkdir -p infrastructure/{terraform,scripts}
   cd infrastructure
   ```

2. **Azure Backend Storage** (run `scripts/setup.sh`)
   - Creates storage account for Terraform state
   - Generates service principal credentials
   - Sets up `.env` template

3. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Fill in subscription ID and service principal details
   - Set database password and other secrets

### Phase 2: Infrastructure Deployment

1. **Terraform Configuration**
   - Single `main.tf` file with all resources
   - Basic tier services for cost optimization
   - Environment variables for configuration

2. **Deploy Infrastructure** (run `scripts/deploy.sh`)
   - Terraform plan and apply
   - Creates all Azure resources
   - Outputs connection strings and URLs

### Phase 3: Application Deployment

1. **Database Setup**
   - Run Prisma migrations
   - Optional: seed initial data
2. **Backend Deployment**
   - GitHub Actions or manual deployment
   - Deploy to App Service
   - Configure environment variables

3. **Frontend Deployment**
   - Build React app with correct API URL
   - Deploy to Static Web App via GitHub Actions

## 💰 Cost Management

### Monthly Cost Breakdown (USD)

**Minimal Setup**:

- Static Web App (Free): $0
- App Service B1: ~$13
- PostgreSQL B1ms: ~$12
- **Total: ~$25/month**

**With Optional Services**:

- Add Key Vault: +$1
- Add Storage Account: +$2-5
- Add Application Insights: +$2-5
- **Total: ~$30-35/month**

### Cost Optimization Strategies

1. **Start Minimal**
   - Begin with just App Service + Database
   - Add monitoring and storage when needed
   - Use free tiers where available

2. **Resource Management**
   - Stop/start App Service during low usage
   - Use Burstable database tier
   - Set up billing alerts

3. **Growth Planning**
   - Monitor usage patterns
   - Scale up only when necessary
   - Consider reserved instances for long-term savings

### Scaling Timeline

**Immediate** (Month 1-3):

- Basic App Service + Database
- Local development environment
- Manual deployments

**Growth** (Month 3-6):

- Add monitoring (Application Insights)
- Set up CI/CD pipelines
- Add file storage for receipts

**Scale** (Month 6+):

- Upgrade to Standard tiers
- Add staging environment
- Consider Premium features

## 📊 Monitoring Essentials

### Built-in Monitoring

**App Service Logs**:

- Access via Azure Portal
- Basic performance metrics
- Error tracking

**Database Monitoring**:

- PostgreSQL flexible server metrics
- Connection monitoring
- Query performance insights

### Optional Application Insights

**When to Add**:

- When you have regular users
- Need detailed performance tracking
- Want custom analytics

**Key Metrics to Track**:

- Response times
- Error rates
- User flows
- Database performance

## 🔧 Maintenance

### Essential Tasks

**Weekly**:

- Check error logs
- Monitor costs
- Review security alerts

**Monthly**:

- Update dependencies
- Review resource usage
- Backup verification

**Quarterly**:

- Security review
- Performance optimization
- Cost analysis and optimization

### Backup Strategy

**Database**:

- Automatic daily backups (7-day retention)
- Point-in-time restore available
- Manual backup script for long-term storage

**Application Code**:

- Git repository (GitHub)
- Automated deployments preserve history

### Security Best Practices

**Immediate**:

- Use HTTPS only
- Environment variables for secrets
- Database firewall rules

**When Growing**:

- Add Key Vault for secret management
- Implement proper RBAC
- Regular security updates

### Troubleshooting Common Issues

**App Service Issues**:

```bash
# View logs
az webapp log tail --name grouppay-api --resource-group grouppay-rg

# Restart service
az webapp restart --name grouppay-api --resource-group grouppay-rg
```

**Database Issues**:

```bash
# Check connection
az postgres flexible-server show --resource-group grouppay-rg --name grouppay-postgres

# Test connectivity
psql "postgresql://username:password@hostname:5432/database?sslmode=require"
```

**Static Web App Issues**:

- Check GitHub Actions build logs
- Verify environment variables
- Check custom domain configuration

### Deployment Checklist

**Pre-deployment**:

- [ ] Azure subscription active
- [ ] Service principal created
- [ ] Environment variables configured
- [ ] Database password set

**Initial Deployment**:

- [ ] Run setup script
- [ ] Deploy infrastructure via Terraform
- [ ] Run database migrations
- [ ] Deploy applications
- [ ] Test all functionality

**Post-deployment**:

- [ ] Set up monitoring alerts
- [ ] Configure backup verification
- [ ] Document access credentials
- [ ] Set up cost monitoring

This streamlined approach prioritizes cost-effectiveness while maintaining good deployment practices. Start with the minimal setup and add features as your application grows and usage justifies the additional costs.
