# FlysSeats - Deployment Guide

## Prerequisites

### Required Tools
- Azure CLI (`az cli`) - Version 2.0+
- Terraform - Version 1.0+
- Node.js - Version 18+
- Python - Version 3.9+
- Azure Functions Core Tools - Version 4+

### Required Accounts
- Azure subscription (active)
- GitHub account with repository access

## Step-by-Step Deployment

### 1. Azure Setup

#### Login to Azure
```bash
az login
az account set --subscription <your-subscription-id>
```

#### Create Service Principal for Terraform
```bash
az ad sp create-for-rbac --name "flyseats-terraform" --role="Contributor" --scopes="/subscriptions/<subscription-id>"
```

Save the output:
- `appId` → ARM_CLIENT_ID
- `password` → ARM_CLIENT_SECRET
- `tenant` → ARM_TENANT_ID

### 2. GitHub Secrets Configuration

Go to GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

#### Terraform Secrets
- `ARM_CLIENT_ID` - Service principal app ID
- `ARM_CLIENT_SECRET` - Service principal password
- `ARM_SUBSCRIPTION_ID` - Your Azure subscription ID
- `ARM_TENANT_ID` - Your Azure tenant ID

#### Deployment Secrets
- `AZURE_WEBAPP_NAME` - Will be created by Terraform
- `AZURE_FUNCTIONAPP_NAME` - Will be created by Terraform

### 3. Infrastructure Deployment (Terraform)

#### Initialize Terraform
```bash
cd infrastructure/terraform
terraform init
```

#### Plan Infrastructure
```bash
terraform plan -var="environment=dev" -var="location=eastus"
```

#### Apply Infrastructure
```bash
terraform apply -var="environment=dev" -var="location=eastus"
```

#### Get Outputs
```bash
terraform output
```

Save these values:
- `web_app_name` → Update GitHub secret `AZURE_WEBAPP_NAME`
- `function_app_name` → Update GitHub secret `AZURE_FUNCTIONAPP_NAME`

### 4. Get Publish Profiles

#### Get Web App Publish Profile
```bash
az webapp deployment list-publishing-profiles \
  --name <web-app-name> \
  --resource-group <resource-group-name> \
  --xml
```

Save output → GitHub secret `AZURE_WEBAPP_PUBLISH_PROFILE`

#### Get Function App Publish Profile
```bash
az functionapp deployment list-publishing-profiles \
  --name <function-app-name> \
  --resource-group <resource-group-name> \
  --xml
```

Save output → GitHub secret `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

### 5. Deploy via GitHub Actions

#### Automatic Deployment
Push to `main` branch:
```bash
git push origin main
```

GitHub Actions will automatically:
1. Build frontend
2. Build backend
3. Deploy to Azure

#### Manual Deployment

**Frontend:**
```bash
cd flyseats-frontend
npm run build
az webapp deployment source config-zip \
  --resource-group <rg-name> \
  --name <webapp-name> \
  --src dist.zip
```

**Backend:**
```bash
cd backend
func azure functionapp publish <functionapp-name>
```

### 6. Manual Deployment (Alternative)

If you prefer manual deployment without GitHub Actions:

#### Frontend Manual Deploy
```bash
cd flyseats-frontend

# Build for production
npm run build -- --configuration production

# Create deployment package
cd dist/flyseats-frontend
zip -r ../dist.zip .

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group flyseats-dev-rg \
  --name flyseats-dev-webapp \
  --src ../dist.zip
```

#### Backend Manual Deploy
```bash
cd backend

# Publish using Azure Functions Core Tools
func azure functionapp publish flyseats-dev-functions --python
```

### 7. Configuration Updates

#### Update Frontend API URL
Create environment file in Angular:

`flyseats-frontend/src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://flyseats-dev-functions.azurewebsites.net/api'
};
```

Update services to use environment:
```typescript
import { environment } from '../../environments/environment';

export class FlightService {
  private readonly API_URL = `${environment.apiUrl}/flights`;
  // ...
}
```

#### Update Backend CORS
In Terraform `resources.tf`:
```hcl
cors {
  allowed_origins = [
    "https://flyseats-dev-webapp.azurewebsites.net"
  ]
}
```

### 8. Verify Deployment

#### Check Frontend
```bash
curl https://flyseats-dev-webapp.azurewebsites.net
```

#### Check Backend
```bash
curl https://flyseats-dev-functions.azurewebsites.net/api/flights/search
```

#### Test in Browser
1. Navigate to web app URL
2. Test login flow
3. Test flight search
4. Check browser console for errors

### 9. Monitoring

#### Enable Application Insights
```bash
az monitor app-insights component create \
  --app flyseats-insights \
  --location eastus \
  --resource-group flyseats-dev-rg
```

#### Configure in Function App
```bash
az functionapp config appsettings set \
  --name flyseats-dev-functions \
  --resource-group flyseats-dev-rg \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=<key>
```

### 10. Environment-Specific Deployment

#### Development
```bash
terraform apply -var="environment=dev"
```

#### Staging
```bash
terraform apply -var="environment=staging"
```

#### Production
```bash
terraform apply -var="environment=prod" -var="app_service_sku=P1V2"
```

## Troubleshooting

### Build Failures

**Frontend Build Error:**
```bash
cd flyseats-frontend
npm install
npm run build
```

**Backend Deploy Error:**
```bash
cd backend
func azure functionapp publish <name> --python --build remote
```

### CORS Issues
Update Function App CORS:
```bash
az functionapp cors add \
  --name flyseats-dev-functions \
  --resource-group flyseats-dev-rg \
  --allowed-origins https://flyseats-dev-webapp.azurewebsites.net
```

### SSL Certificate
Azure provides free SSL certificates. Enable:
```bash
az webapp update \
  --name flyseats-dev-webapp \
  --resource-group flyseats-dev-rg \
  --set httpsOnly=true
```

## Rollback Procedures

### Rollback Frontend
```bash
# Find previous deployment
az webapp deployment list --name <webapp-name> --resource-group <rg-name>

# Redeploy specific version
az webapp deployment source config-zip \
  --name <webapp-name> \
  --resource-group <rg-name> \
  --src <previous-build.zip>
```

### Rollback Backend
```bash
# Use deployment slots
az functionapp deployment slot swap \
  --name <functionapp-name> \
  --resource-group <rg-name> \
  --slot staging
```

### Rollback Infrastructure
```bash
cd infrastructure/terraform
terraform apply -var="environment=dev" -target=<specific-resource>
```

## Cost Optimization

### Development Environment
- Use Consumption plan (Y1) for Functions
- Use Free tier for App Service when testing
- Delete resources when not in use

### Production Environment
- Use Premium plan for better performance
- Enable autoscaling
- Use CDN for static content
- Implement caching strategies

## Security Checklist

- [ ] Enable HTTPS only
- [ ] Configure authentication on App Service
- [ ] Implement API keys for Functions
- [ ] Set up network security groups
- [ ] Enable DDoS protection
- [ ] Configure Web Application Firewall
- [ ] Implement rate limiting
- [ ] Enable diagnostic logs
- [ ] Set up alerts for suspicious activity

## Monitoring and Alerts

```bash
# Enable diagnostic logs
az monitor diagnostic-settings create \
  --name flyseats-logs \
  --resource <resource-id> \
  --logs '[{"category": "FunctionAppLogs", "enabled": true}]' \
  --workspace <workspace-id>
```

## Continuous Deployment

The project is configured for CD with GitHub Actions. Every push to `main`:
1. Runs tests
2. Builds artifacts
3. Deploys to Azure

To disable automatic deployment, remove the `deploy` job from workflow files.

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Check Azure Portal diagnostics
3. Review Application Insights logs
4. Check function logs in Azure Portal
