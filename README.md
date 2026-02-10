# FlysSeats - Flight Booking Platform

A modern, full-stack flight booking application built with Angular 15+, Python Azure Functions, and deployed on Azure infrastructure.

## 🚀 Technology Stack

### Frontend
- **Framework**: Angular 15+ with TypeScript
- **UI Library**: Angular Material Design
- **Styling**: SCSS with mobile-first responsive design
- **State Management**: RxJS Observables
- **Caching**: sessionStorage
- **Internationalization**: ngx-translate (English & Spanish)
- **Testing**: Jasmine, Karma, Cypress E2E
- **Mobile**: Capacitor for native iOS/Android builds

### Backend
- **Runtime**: Python 3.9+
- **Platform**: Azure Functions (Serverless)
- **API**: RESTful endpoints
- **Authentication**: JWT (planned)

### Infrastructure
- **Cloud Provider**: Microsoft Azure
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Services**:
  - Azure App Service (Frontend hosting)
  - Azure Functions (Backend APIs)
  - Azure Storage Account

## 📁 Project Structure

```
TFM-FlysSeats/
├── flyseats-frontend/          # Angular frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Core services, guards, interceptors
│   │   │   ├── features/       # Feature modules (auth, flights, bookings)
│   │   │   └── shared/         # Shared components
│   │   └── assets/
│   │       └── i18n/           # Translation files
│   ├── cypress/                # E2E tests
│   └── capacitor.config.ts     # Capacitor mobile configuration
├── backend/                    # Python Azure Functions
│   ├── functions/
│   │   ├── auth/              # Authentication endpoints
│   │   ├── flights/           # Flight search endpoints
│   │   └── bookings/          # Booking management endpoints
│   └── requirements.txt
├── infrastructure/
│   └── terraform/             # Infrastructure as Code
└── .github/
    └── workflows/             # CI/CD pipelines
```

## 🎯 Features

### Frontend Features
- ✅ **Modular Architecture**: Lazy-loaded feature modules
- ✅ **Standalone Components**: Modern Angular standalone components
- ✅ **Authentication**: Login with auth guards protecting routes
- ✅ **Flight Search**: Search flights with date pickers and filters
- ✅ **Booking Management**: View and manage flight bookings
- ✅ **Multi-language**: English and Spanish translations
- ✅ **Responsive Design**: Mobile-first UI with Material Design
- ✅ **Caching**: sessionStorage for improved performance
- ✅ **Observables**: RxJS for reactive data management

### Backend Features
- ✅ **REST APIs**: Azure Functions HTTP triggers
- ✅ **CORS Enabled**: Cross-origin support
- ✅ **Modular Functions**: Separate functions for auth, flights, bookings
- ✅ **Mock Data**: Sample data for development

### Infrastructure Features
- ✅ **Terraform IaC**: Complete Azure infrastructure definition
- ✅ **CI/CD Pipelines**: Automated deployment workflows
- ✅ **Multi-environment**: Dev, staging, prod support

## 🛠️ Setup and Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Azure CLI (for deployment)
- Terraform (for infrastructure)

### Frontend Setup

```bash
cd flyseats-frontend

# Install dependencies
npm install

# Start development server
npm start

# Navigate to http://localhost:4200
```

### Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Install Azure Functions Core Tools
# https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local

# Start local Azure Functions
func start
```

## 📱 Mobile Build (Capacitor)

```bash
cd flyseats-frontend

# Build web app
npm run build

# Add platforms
npm run cap:android  # For Android
npm run cap:ios      # For iOS

# Sync web build to native projects
npm run cap:sync
```

## 🧪 Testing

### Unit Tests
```bash
cd flyseats-frontend
npm test
```

### E2E Tests (Cypress)
```bash
cd flyseats-frontend

# Open Cypress Test Runner
npm run cypress:open

# Run tests headlessly
npm run cypress:run
```

## 🏗️ Infrastructure Deployment

### Using Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure
terraform apply

# Destroy infrastructure (if needed)
terraform destroy
```

### Required Azure Secrets
Configure these in GitHub repository secrets:
- `ARM_CLIENT_ID`
- `ARM_CLIENT_SECRET`
- `ARM_SUBSCRIPTION_ID`
- `ARM_TENANT_ID`
- `AZURE_WEBAPP_NAME`
- `AZURE_WEBAPP_PUBLISH_PROFILE`
- `AZURE_FUNCTIONAPP_NAME`
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

## 🚢 CI/CD Pipelines

The project includes three GitHub Actions workflows:

1. **Frontend CI/CD** (`.github/workflows/frontend-ci-cd.yml`)
   - Build Angular app
   - Run tests
   - Deploy to Azure App Service

2. **Backend CI/CD** (`.github/workflows/backend-ci-cd.yml`)
   - Package Python functions
   - Deploy to Azure Functions

3. **Infrastructure** (`.github/workflows/terraform.yml`)
   - Validate Terraform
   - Plan infrastructure changes
   - Apply changes on main branch

## 🌍 Multi-language Support

The application supports multiple languages via ngx-translate:
- English (default)
- Spanish

Translation files: `flyseats-frontend/src/assets/i18n/*.json`

## 🔐 Security Features

- HTTP Interceptor for JWT token management
- Route guards for protected pages
- sessionStorage for secure client-side caching
- CORS configuration

## 📊 Architecture Patterns

- **Service Layer**: Centralized business logic
- **Observables**: Reactive data streams with RxJS
- **Lazy Loading**: Route-based code splitting
- **Standalone Components**: Modern Angular architecture
- **Repository Pattern**: Data access abstraction (backend)

## 🔄 Development Workflow

1. Clone repository
2. Install frontend dependencies: `cd flyseats-frontend && npm install`
3. Install backend dependencies: `cd backend && pip install -r requirements.txt`
4. Start frontend: `npm start`
5. Start backend: `func start`
6. Run tests: `npm test` and `npm run cypress:run`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Flights
- `POST /api/flights/search` - Search flights

### Bookings
- `GET /api/bookings/:id?` - Get bookings
- `POST /api/bookings` - Create booking
- `DELETE /api/bookings/:id` - Cancel booking

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Yoel Perez Carrasco

## 🙏 Acknowledgments

- Angular Team
- Azure Functions Team
- Material Design Team
- Open Source Community
