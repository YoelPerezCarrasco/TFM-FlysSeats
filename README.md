# FlysSeats - Flight Booking Platform

A modern, full-stack flight booking application built with Angular 15+ and a Python Flask backend, optimized for local-first development with Docker and MongoDB.

## ⚠️ Security Notice

**Important**: This project uses Angular 15.2.10, which has known security vulnerabilities (XSS via SVG attributes) that will not receive patches. 

**For production use**, upgrade to Angular 19.2.18+ or later. See [SECURITY.md](SECURITY.md) for detailed information and mitigation strategies.

**Current Status**: Suitable for development/learning purposes with implemented mitigations. Not recommended for production without upgrading Angular.

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
- **Platform**: Flask API (Docker-ready)
- **API**: RESTful endpoints
- **Authentication**: JWT (planned)

### Infrastructure
- **Cloud Provider**: Microsoft Azure
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **Services**:
   - Azure App Service (optional cloud deployment)
   - Flask Web App backend
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
├── backend/                    # Python Flask backend
│   ├── app.py                 # API entrypoint
│   ├── utils/                 # DB/API clients
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
- ✅ **REST APIs**: Flask endpoints
- ✅ **CORS Enabled**: Cross-origin support
- ✅ **Modular Services**: auth, flights, bookings, swaps
- ✅ **Mock Data**: Sample data for development

### Infrastructure Features
- ✅ **Terraform IaC**: Complete Azure infrastructure definition
- ✅ **CI/CD Pipelines**: Automated deployment workflows
- ✅ **Multi-environment**: Dev, staging, prod support

## 🛠️ Setup and Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Docker + Docker Compose

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

# Local-first mode (sin Azure)
cp .env.example .env
export LOCAL_MODE=true
export DB_MODE=mongodb

# Opcional: auto levantar mongo/redis por Docker al arrancar dev.sh
# export AUTO_START_DOCKER_SERVICES=true

# Start local backend (Flask)
python app.py
```

### Full Local Stack with Docker

```bash
# From project root
docker compose up --build

# Or using Makefile
make docker-up
```

Services:
- Frontend: http://localhost:4200
- Backend API: http://localhost:8000/api
- MongoDB: localhost:27017
- Mongo Express (UI): http://localhost:8081
- Redis: localhost:6379

Seed de datos de ejemplo en Mongo:

```bash
make mongo-seed
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

### Required Azure Secrets (optional)
Only needed if you manually trigger cloud deployment:
- `AZURE_WEBAPP_PUBLISH_PROFILE`

## 🚢 CI/CD Pipelines

The project includes two active GitHub Actions workflows:

1. **Backend CI + optional deploy** (`.github/workflows/backend-deploy.yml`)
   - Python checks on `push`
   - Optional deploy on manual trigger (`workflow_dispatch`)

2. **Health Check** (`.github/workflows/health-check.yml`)
   - Manual API health validation (when `HEALTH_CHECK_URL` is configured)

## 🌍 Multi-language Support

The application supports multiple languages via ngx-translate:
- English (default)
- Spanish

Translation files: `flyseats-frontend/src/assets/i18n/*.json`

## 🔐 Security

### Known Vulnerabilities
This project uses Angular 15.2.10 which has known XSS vulnerabilities. See [SECURITY.md](SECURITY.md) for:
- Detailed vulnerability information
- Mitigation strategies
- Upgrade recommendations
- Security best practices

### Implemented Security Features

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
4. Start all local services (sin Azure): `make dev` o `bash scripts/dev.sh`
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
- Flask Team
- Material Design Team
- Open Source Community
