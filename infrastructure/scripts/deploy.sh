#!/bin/bash

# Azure Infrastructure Deployment Script for Group Pay
# This script deploys the Azure infrastructure using Terraform

set -e

# Change to terraform directory
cd "$(dirname "$0")/../terraform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Group Pay infrastructure to Azure...${NC}"

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo -e "${RED}❌ Environment file not found. Please run setup.sh first.${NC}"
    exit 1
fi

# Load environment variables
source ../.env

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}⚠️  terraform.tfvars not found. Creating from example...${NC}"
    cp terraform.tfvars.example terraform.tfvars
    echo -e "${YELLOW}📝 Please review and customize terraform.tfvars before continuing.${NC}"
    read -p "Press Enter to continue after reviewing terraform.tfvars..."
fi

# Export Azure credentials for Terraform
export ARM_CLIENT_ID="$AZURE_CLIENT_ID"
export ARM_CLIENT_SECRET="$AZURE_CLIENT_SECRET"
export ARM_SUBSCRIPTION_ID="$AZURE_SUBSCRIPTION_ID"
export ARM_TENANT_ID="$AZURE_TENANT_ID"

# Initialize Terraform
echo -e "${BLUE}🔄 Initializing Terraform...${NC}"
terraform init

# Validate Terraform configuration
echo -e "${BLUE}✅ Validating Terraform configuration...${NC}"
terraform validate

# Plan the deployment
echo -e "${BLUE}📋 Planning infrastructure deployment...${NC}"
terraform plan -out=tfplan

# Ask for confirmation
echo -e "${YELLOW}⚠️  Ready to deploy infrastructure. This will create Azure resources and incur costs.${NC}"
echo -e "${YELLOW}💰 Estimated monthly cost: ~$25-35 USD${NC}"
read -p "Do you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled.${NC}"
    exit 1
fi

# Apply the deployment
echo -e "${BLUE}🚀 Deploying infrastructure...${NC}"
terraform apply tfplan

# Save outputs
echo -e "${BLUE}📝 Saving deployment outputs...${NC}"
terraform output -json > outputs.json

# Display important information
echo -e "${GREEN}✅ Infrastructure deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "• Resource Group: $(terraform output -raw resource_group_name)"
echo "• API URL: $(terraform output -raw app_service_url)"
echo "• Web App URL: $(terraform output -raw static_web_app_url)"
echo "• Database Host: $(terraform output -raw database_host)"
echo ""
echo -e "${BLUE}🔑 Important Information:${NC}"
echo "• Database credentials are in Terraform outputs (use 'terraform output' to view)"
echo "• Static Web App deployment token is needed for GitHub Actions"
echo "• API App Service is ready for deployment"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Set up GitHub Actions for automatic deployments"
echo "2. Deploy the API application to App Service"
echo "3. Configure the frontend with the API URL"
echo "4. Run database migrations"
echo ""
echo -e "${YELLOW}⚠️  Security Reminders:${NC}"
echo "• Database is accessible from all IPs (development mode)"
echo "• Consider restricting access in production"
echo "• Monitor costs in Azure Portal"
echo "• Set up billing alerts"

# Create environment file for applications
echo -e "${BLUE}📝 Creating application environment file...${NC}"
cat > ../../.env.azure << EOF
# Azure Environment Configuration for Group Pay Applications
# Generated on $(date)

# API Configuration
DATABASE_URL="$(terraform output -raw database_url)"
JWT_SECRET="$(terraform output -raw jwt_secret)"
NODE_ENV=production

# Frontend Configuration
VITE_API_URL="$(terraform output -raw app_service_url)"

# Deployment Configuration
AZURE_RESOURCE_GROUP="$(terraform output -raw resource_group_name)"
AZURE_APP_SERVICE_NAME="$(terraform output -raw app_service_name)"
AZURE_STATIC_WEB_APP_NAME="$(terraform output -raw static_web_app_name)"
AZURE_STATIC_WEB_APP_TOKEN="$(terraform output -raw static_web_app_deployment_token)"
EOF

echo -e "${GREEN}✅ Application environment file created at ../../.env.azure${NC}"
echo -e "${YELLOW}⚠️  Remember to add *.env.* to .gitignore to protect secrets${NC}"