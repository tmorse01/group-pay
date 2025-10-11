#!/bin/bash

# Azure Infrastructure Setup Script for Group Pay
# This script sets up the initial Azure resources needed for Terraform state management

set -e

# Configuration
TERRAFORM_RG_NAME="grouppay-terraform-rg"
TERRAFORM_STORAGE_ACCOUNT="grouppayterraformstate"
TERRAFORM_CONTAINER="terraform-state"
LOCATION="West US"

echo "🚀 Setting up Azure infrastructure for Group Pay..."

# Check if Azure CLI is installed and user is logged in
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    echo "❌ You are not logged into Azure. Please run 'az login' first."
    exit 1
fi

# Get current subscription info
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)

echo "📋 Using Azure subscription:"
echo "   Name: $SUBSCRIPTION_NAME"
echo "   ID: $SUBSCRIPTION_ID"

# Create resource group for Terraform state
echo "📦 Creating resource group for Terraform state..."
az group create \
    --name "$TERRAFORM_RG_NAME" \
    --location "$LOCATION" \
    --tags "Application=GroupPay" "Purpose=TerraformState" "ManagedBy=Script"

# Create storage account for Terraform state
echo "💾 Creating storage account for Terraform state..."

# Generate a unique storage account name (storage account names must be globally unique)
TIMESTAMP=$(date +%s)
STORAGE_NAME="${TERRAFORM_STORAGE_ACCOUNT}${TIMESTAMP: -6}"

az storage account create \
    --name "$STORAGE_NAME" \
    --resource-group "$TERRAFORM_RG_NAME" \
    --location "$LOCATION" \
    --sku "Standard_LRS" \
    --tags "Application=GroupPay" "Purpose=TerraformState" "ManagedBy=Script"

# Get storage account key
STORAGE_KEY=$(az storage account keys list \
    --resource-group "$TERRAFORM_RG_NAME" \
    --account-name "$STORAGE_NAME" \
    --query '[0].value' -o tsv)

# Create blob container for Terraform state
echo "📁 Creating blob container for Terraform state..."
az storage container create \
    --name "$TERRAFORM_CONTAINER" \
    --account-name "$STORAGE_NAME" \
    --account-key "$STORAGE_KEY"

# Create service principal for Terraform
echo "🔑 Creating service principal for Terraform..."
SP_OUTPUT=$(az ad sp create-for-rbac \
    --name "grouppay-terraform-sp" \
    --role "Contributor" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID" \
    --output json)

CLIENT_ID=$(echo $SP_OUTPUT | jq -r '.appId')
CLIENT_SECRET=$(echo $SP_OUTPUT | jq -r '.password')
TENANT_ID=$(echo $SP_OUTPUT | jq -r '.tenant')

# Create .env file with configuration
echo "📝 Creating environment configuration file..."
cat > ../infrastructure/.env << EOF
# Azure Configuration for Group Pay Terraform
# Generated on $(date)

# Azure Subscription
AZURE_SUBSCRIPTION_ID="$SUBSCRIPTION_ID"
AZURE_TENANT_ID="$TENANT_ID"

# Service Principal for Terraform
AZURE_CLIENT_ID="$CLIENT_ID"
AZURE_CLIENT_SECRET="$CLIENT_SECRET"

# Terraform Backend Configuration
TERRAFORM_RESOURCE_GROUP_NAME="$TERRAFORM_RG_NAME"
TERRAFORM_STORAGE_ACCOUNT_NAME="$STORAGE_NAME"
TERRAFORM_CONTAINER_NAME="$TERRAFORM_CONTAINER"

# Database Configuration (change the password!)
DB_ADMIN_PASSWORD="$(openssl rand -base64 32)"

# JWT Secret (change this!)
JWT_SECRET="$(openssl rand -base64 64)"
EOF

# Update Terraform backend configuration
echo "🔧 Updating Terraform backend configuration..."
sed -i.bak "s/grouppayterraformstate/$STORAGE_NAME/g" ../terraform/main.tf

echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Review and customize infrastructure/terraform/terraform.tfvars.example"
echo "2. Copy it to infrastructure/terraform/terraform.tfvars"
echo "3. Update the database password and JWT secret in infrastructure/.env"
echo "4. Run ./deploy.sh to deploy the infrastructure"
echo ""
echo "🔐 Important security notes:"
echo "- Service principal credentials are in infrastructure/.env"
echo "- Add infrastructure/.env to .gitignore to keep secrets safe"
echo "- Consider using Azure Key Vault for production secrets"
echo ""
echo "💰 Estimated monthly cost: ~$25-35 USD"
echo "   - App Service B1: ~$13/month"
echo "   - PostgreSQL B1ms: ~$12/month"
echo "   - Static Web App: Free"
echo "   - Storage Account: ~$2-5/month"