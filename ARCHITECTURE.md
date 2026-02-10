# FlysSeats - Architecture Documentation

## Project Overview

FlysSeats is a modern flight booking platform demonstrating enterprise-grade Angular development with cloud-native backend services.

## Technical Implementation

### Frontend Architecture (Angular 15+)

#### Core Services (RxJS Observables)
1. **AuthService** (`core/services/auth.service.ts`)
   - User authentication management
   - JWT token handling
   - BehaviorSubject for reactive user state
   - sessionStorage integration

2. **CacheService** (`core/services/cache.service.ts`)
   - sessionStorage wrapper
   - Typed cache operations
   - Error handling

3. **FlightService** (`core/services/flight.service.ts`)
   - Flight search with caching
   - Observable-based API calls
   - Query parameter handling

4. **BookingService** (`core/services/booking.service.ts`)
   - Booking CRUD operations
   - Cache invalidation on mutations

#### Routing & Guards

**Lazy Loading Routes:**
```typescript
- /auth/login          → LoginComponent (standalone)
- /flights            → FlightSearchComponent (standalone)
- /bookings           → BookingsListComponent (standalone, protected)
```

**AuthGuard** protects authenticated routes and redirects to login.

#### HTTP Interceptor
**AuthInterceptor** automatically adds JWT token to all HTTP requests.

#### Standalone Components
All feature components are standalone (no NgModules required):
- `LoginComponent` - Material Design form with validation
- `FlightSearchComponent` - Search with date pickers and results
- `BookingsListComponent` - List with status chips

#### Internationalization (i18n)
- **ngx-translate** for runtime translation
- Language files: `assets/i18n/{en,es}.json`
- Instant language switching
- Translation keys organized by feature

#### Mobile Support (Capacitor)
- Configured for iOS and Android
- Web build wrapping
- Commands in package.json

### Backend Architecture (Azure Functions)

#### Python Functions
1. **Auth Function** (`functions/auth/__init__.py`)
   - POST `/api/auth/login`
   - Mock JWT generation
   - HTTP trigger

2. **Flights Function** (`functions/flights/__init__.py`)
   - POST `/api/flights/search`
   - Query parameter handling
   - Mock flight data

3. **Bookings Function** (`functions/bookings/__init__.py`)
   - GET `/api/bookings/:id?`
   - POST `/api/bookings`
   - DELETE `/api/bookings/:id`
   - Mock booking data

#### Function Configuration
- **host.json** - Global function settings
- **local.settings.json** - Local development config
- **function.json** per function - Bindings and triggers

### Infrastructure (Terraform)

#### Resources Defined
1. **Azure Resource Group** - Container for all resources
2. **Storage Account** - Function storage
3. **App Service Plan (Functions)** - Consumption (Y1) plan for serverless
4. **Function App** - Python 3.9 runtime
5. **App Service Plan (Web)** - B1 SKU for frontend
6. **Web App** - Node.js 18 LTS for Angular

#### Variables
- `project_name` - Default: "flyseats"
- `environment` - Default: "dev"
- `location` - Default: "eastus"
- `app_service_sku` - Default: "B1"

#### Outputs
- Resource group name
- Function app hostname
- Web app hostname

### CI/CD Pipelines (GitHub Actions)

#### Frontend Pipeline
```yaml
Trigger: Push/PR to flyseats-frontend/**
Steps:
  1. Setup Node.js 18
  2. Install dependencies (npm ci)
  3. Build production app
  4. Run unit tests
  5. Deploy to Azure Web App (main branch only)
```

#### Backend Pipeline
```yaml
Trigger: Push/PR to backend/**
Steps:
  1. Setup Python 3.9
  2. Install dependencies
  3. Package functions
  4. Deploy to Azure Functions (main branch only)
```

#### Infrastructure Pipeline
```yaml
Trigger: Push/PR to infrastructure/**, manual
Steps:
  1. Setup Terraform
  2. terraform init
  3. terraform fmt -check
  4. terraform validate
  5. terraform plan
  6. terraform apply (main branch only)
```

### Testing Strategy

#### Unit Tests (Jasmine/Karma)
- Angular component tests
- Service tests
- Run: `npm test`

#### E2E Tests (Cypress)
- User flow testing
- Authentication flow
- Flight search flow
- Run: `npm run cypress:run`

## Design Patterns

### Frontend Patterns
1. **Service Layer Pattern** - Business logic in services
2. **Observable Pattern** - RxJS for async operations
3. **Guard Pattern** - Route protection
4. **Interceptor Pattern** - HTTP request modification
5. **Repository Pattern** - Data access abstraction

### Backend Patterns
1. **Serverless Pattern** - Event-driven functions
2. **API Gateway Pattern** - HTTP triggers as API endpoints
3. **Microservices Pattern** - Separate functions per domain

## Security Features

1. **Authentication Guard** - Prevents unauthorized access
2. **HTTP Interceptor** - Automatic token injection
3. **sessionStorage** - Client-side secure storage
4. **CORS Configuration** - Controlled cross-origin access
5. **HTTPS Only** - Azure enforces HTTPS

## Performance Optimizations

1. **Lazy Loading** - Routes loaded on demand
2. **sessionStorage Caching** - Reduced API calls
3. **Standalone Components** - Smaller bundle sizes
4. **Tree Shaking** - Unused code elimination
5. **AOT Compilation** - Faster rendering

## Responsive Design

- **Mobile-First Approach** - Designed for mobile, enhanced for desktop
- **Material Design** - Consistent UI/UX
- **Breakpoints** - Responsive layouts at 768px
- **Flexbox Layouts** - Fluid responsive grids

## Development Workflow

1. **Local Development**
   ```bash
   # Frontend
   cd flyseats-frontend && npm start
   
   # Backend
   cd backend && func start
   ```

2. **Feature Development**
   - Create feature branch
   - Implement changes
   - Write tests
   - Commit and push
   - Create PR
   - CI/CD runs automatically

3. **Deployment**
   - Merge to main
   - Pipelines deploy automatically
   - Infrastructure changes via Terraform

## Environment Configuration

### Local Development
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:7071/api`

### Azure Production
- Frontend: `https://{project}-{env}-webapp.azurewebsites.net`
- Backend: `https://{project}-{env}-functions.azurewebsites.net/api`

## Future Enhancements

1. **Database Integration**
   - Azure Cosmos DB or SQL Database
   - Entity Framework or ORM

2. **Real Authentication**
   - Azure AD B2C
   - JWT implementation
   - Refresh tokens

3. **Payment Integration**
   - Stripe or Azure Payment Gateway

4. **Real-time Updates**
   - SignalR for live flight updates

5. **Advanced Caching**
   - Redis Cache
   - CDN for static assets

6. **Monitoring**
   - Application Insights
   - Log Analytics

## Key Learnings

This project demonstrates:
- Modern Angular development with standalone components
- Cloud-native serverless architecture
- Infrastructure as Code with Terraform
- CI/CD automation with GitHub Actions
- Responsive, accessible UI design
- Multi-language support
- Mobile app generation from web code
- Enterprise-grade project structure
