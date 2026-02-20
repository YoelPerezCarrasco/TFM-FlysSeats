# Sprint 1 — Informe de Desarrollo

## Proyecto: SitFly (anteriormente FlysSeats)
### Trabajo Fin de Máster — Plataforma de Reserva e Intercambio de Asientos de Vuelos

**Autor:** Yoel Pérez Carrasco  
**Período del Sprint:** 10 de febrero 2026 — 20 de febrero 2026  
**Duración:** 11 días  
**Total de commits:** 65  
**Líneas de código:** ~8.900+ (backend: 2.739 | frontend: 5.909 | infraestructura: 426)

---

## 1. Objetivos del Sprint 1

El Sprint 1 ha tenido como objetivo establecer las bases completas de la plataforma SitFly, abarcando:

1. **Infraestructura Cloud (Azure)** — Provisión de todos los recursos necesarios en Azure mediante Terraform.
2. **Backend API REST** — Implementación de un servidor Flask con integración de API externa (Amadeus) y base de datos (Cosmos DB).
3. **Frontend Angular** — Aplicación SPA completa con búsqueda de vuelos, autenticación y gestión de reservas.
4. **CI/CD** — Configuración de pipelines de despliegue automático.
5. **Diseño UX/UI** — Interfaz moderna con tema oscuro, glassmorphism y diseño responsive.

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Angular 15+)                    │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │  Auth     │  │ Flight Search│  │  Bookings  │  │  Navbar   │ │
│  │  Module   │  │   Module     │  │   Module   │  │ Component │ │
│  └────┬─────┘  └──────┬───────┘  └─────┬──────┘  └───────────┘ │
│       │               │                │                         │
│  ┌────┴───────────────┴────────────────┴──────────────────────┐ │
│  │              Core Services (HTTP + Cache)                   │ │
│  │  AuthService | FlightService | BookingService | CacheService│ │
│  └─────────────────────────┬──────────────────────────────────┘ │
└────────────────────────────┼────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              BACKEND (Flask + Gunicorn on Azure App Service)     │
│                                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │ Auth API │  │ Flights API  │  │   Bookings API             │ │
│  │ /api/auth│  │ /api/flights │  │   /api/bookings            │ │
│  └────┬─────┘  └──────┬───────┘  └────────────┬───────────────┘ │
│       │               │                        │                 │
│  ┌────┴───────────────┴────────────────────────┴──────────────┐ │
│  │                     Utility Clients                         │ │
│  │  CosmosDBClient | AmadeusClient | RedisClient | Config     │ │
│  └───────┬──────────────┬─────────────────┬───────────────────┘ │
└──────────┼──────────────┼─────────────────┼─────────────────────┘
           │              │                 │
           ▼              ▼                 ▼
    ┌────────────┐ ┌─────────────┐  ┌─────────────┐
    │ Azure      │ │  Amadeus    │  │ Azure Redis │
    │ Cosmos DB  │ │  REST API   │  │  (opcional) │
    │ (NoSQL)    │ │  (Vuelos)   │  │             │
    └────────────┘ └─────────────┘  └─────────────┘
```

### 2.2 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Angular + TypeScript | 15+ |
| **UI Framework** | Angular Material | 15+ |
| **Estilos** | SCSS + Variables CSS | — |
| **Backend** | Python + Flask | 3.0+ |
| **Servidor WSGI** | Gunicorn | 21.2+ |
| **Base de Datos** | Azure Cosmos DB (SQL API) | — |
| **API Externa** | Amadeus for Developers | SDK 8.0+ |
| **Caché** | Azure Redis Cache (opcional) | 5.0+ |
| **Infraestructura** | Terraform (Azure Provider) | ~3.0 |
| **Hosting** | Azure App Service (Linux) | — |
| **Secrets** | Azure Key Vault | — |
| **Monitorización** | Azure Application Insights | — |
| **CI/CD** | GitHub Actions | — |
| **Control de versiones** | Git + GitHub | — |

---

## 3. Trabajo Realizado — Desglose por Fases

### Fase 1: Configuración Inicial y DevOps (10-17 febrero)

**Commits:** 12 | **Tipo:** ci, docs, feat

| Tarea | Descripción |
|-------|-------------|
| Scaffolding del proyecto Angular | Estructura base con módulos, routing, interceptors y guards |
| Backend Azure Functions (legacy) | Primera versión con Azure Functions v2 (posteriormente migrado a Flask) |
| Terraform IaC | Provisión completa de infraestructura Azure |
| GitHub Actions | Pipeline CI/CD con Publish Profile para despliegue automático |
| Azure DevOps config | Configuración alternativa de CI/CD |
| Documentación inicial | README, ARCHITECTURE.md, SECURITY.md, CONTRIBUTING.md, DEPLOYMENT.md |
| Scripts de datos | Scripts de inicialización, inserción de datos de prueba y visualización de Cosmos DB |

**Recursos Azure provisionados (Terraform):**

| Recurso | Nombre | Propósito |
|---------|--------|-----------|
| Resource Group | `flyseats2-dev-rg` | Contenedor de recursos |
| Cosmos DB Account | Cuenta con Free Tier | Base de datos NoSQL |
| Cosmos DB Database | Base SQL API | 3 contenedores: `users`, `bookings`, `flights-cache` |
| App Service Plan | Linux, compartido | Hosting del backend |
| Linux Web App | `flyseats2-dev-api` | Servidor Flask |
| Key Vault | Almacén de secretos | Credenciales Amadeus |
| Application Insights | Monitorización | Telemetría y logging |
| Storage Account | Blob Storage | Contenedores: `documents`, `tickets` |
| Log Analytics Workspace | Workspace de logs | Análisis de logs |

### Fase 2: Backend API — Flask + Amadeus (19 febrero)

**Commits:** 12 | **Tipo:** feat, fix

#### 2.1 Migración a Flask

Se migró de Azure Functions (function_app.py) a un servidor Flask convencional desplegado en Azure App Service con Gunicorn, debido a mayor flexibilidad y simplicidad de desarrollo.

#### 2.2 Endpoints REST Implementados

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| `GET` | `/api/health` | Health check (Cosmos DB + Amadeus) | No |
| `POST` | `/api/auth/register` | Registro de usuario | No |
| `POST` | `/api/auth/login` | Login (email + password) | No |
| `GET` | `/api/flights` | Buscar vuelos (Amadeus si hay ruta, Cosmos DB si no) | No |
| `GET` | `/api/flights/search` | Búsqueda avanzada Amadeus | No |
| `POST` | `/api/flights` | Crear vuelo | Sí |
| `GET` | `/api/flights/:id` | Detalle de vuelo | No |
| `PUT` | `/api/flights/:id` | Actualizar vuelo | Sí |
| `DELETE` | `/api/flights/:id` | Eliminar vuelo | Sí |
| `POST` | `/api/bookings` | Crear reserva | Sí |
| `GET` | `/api/bookings/:userId` | Listar reservas de usuario | Sí |

#### 2.3 Integración con Amadeus API

La integración con la API de Amadeus es el componente más relevante del backend, proporcionando datos reales de vuelos:

- **Autenticación:** OAuth2 con API Key y Secret almacenados en Azure Key Vault
- **Flujo de búsqueda:** 
  1. Comprueba caché en Redis (si está disponible)
  2. Llama a `flight_offers_search` de Amadeus
  3. Cachea el resultado para futuras peticiones
  4. En caso de error, devuelve datos mock realistas (IB, VY)
- **Datos obtenidos:** Aerolíneas reales, horarios, precios, escalas, duración, tipos de avión

#### 2.4 Módulos Backend

| Módulo | Archivo | Líneas | Descripción |
|--------|---------|--------|-------------|
| App principal | `app.py` | 342 | Servidor Flask, rutas, CORS |
| Configuración | `config.py` | 104 | Variables de entorno, Azure settings |
| Azure Functions (legacy) | `function_app.py` | 595 | Versión original (mantenida como referencia) |
| Cliente Amadeus | `utils/amadeus_client.py` | 368 | Singleton, búsqueda + caché + fallback mock |
| Cliente Cosmos DB | `utils/cosmos_client.py` | 422 | Singleton, CRUD completo 5 contenedores |
| Cliente Redis | `utils/redis_client.py` | 172 | Singleton opcional, degradación elegante |
| Utilidades Vuelos | `utils/flight_utils.py` | 57 | Funciones auxiliares |
| Modelos | `models/*.py` | 356 | Flight, Seat, User, Swap, Message, Rating |
| Scripts | `scripts/*.py` | 323 | Init DB, test data, cleanup, viewer |
| **Total Backend** | **18 archivos** | **2.739** | — |

### Fase 3: Frontend Angular — Componentes Base (19 febrero)

**Commits:** 8 | **Tipo:** feat, fix, refactor

#### 3.1 Estructura de Componentes

```
src/app/
├── app.module.ts              # Módulo raíz
├── app-routing.module.ts      # Lazy loading routes
├── app.component.*            # Shell: navbar + router-outlet
│
├── core/
│   ├── guards/
│   │   └── auth.guard.ts      # Protección de rutas
│   ├── interceptors/
│   │   └── auth.interceptor.ts # Inyección de token JWT
│   ├── models/
│   │   └── index.ts           # 308 líneas de interfaces/enums
│   └── services/
│       ├── auth.service.ts    # Login/registro + BehaviorSubject
│       ├── flight.service.ts  # CRUD vuelos + caché cliente
│       ├── booking.service.ts # CRUD reservas
│       └── cache.service.ts   # Caché en memoria (sessionStorage)
│
├── features/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   └── login/             # Componente standalone
│   ├── flights/
│   │   ├── flights.routes.ts
│   │   └── flight-search/     # Componente principal (~330 líneas TS)
│   └── bookings/
│       ├── bookings.routes.ts
│       └── bookings-list/     # Componente standalone
│
├── assets/i18n/
│   ├── en.json               # Traducciones inglés
│   └── es.json               # Traducciones español
│
└── environments/
    ├── environment.ts         # API URL dev
    └── environment.prod.ts    # API URL producción
```

#### 3.2 Modelos TypeScript (308 líneas)

| Categoría | Interfaces/Enums |
|-----------|-----------------|
| **Enums** | `FlightStatus`, `SeatType` (WINDOW/AISLE/MIDDLE), `SeatSection` (FRONT/MIDDLE/BACK), `SwapStatus` |
| **Usuario** | `UserProfile`, `UserReputation`, `User` |
| **Vuelo** | `Coordinates`, `Airport`, `Aircraft`, `Flight` (dual: legacy + Amadeus), `FlightSearchParams`, `CreateFlightRequest` |
| **Asiento** | `SeatDetails`, `SeatPreferences`, `Seat`, `JoinFlightRequest` |
| **Intercambio** | `SwapParticipant`, `SwapRequest` |
| **Comunicación** | `Message` |
| **Valoración** | `Rating` |

#### 3.3 Servicios Core

| Servicio | Responsabilidad | Patrón |
|----------|----------------|--------|
| `AuthService` | Login, logout, estado reactivo del usuario | `BehaviorSubject<User>` + localStorage |
| `FlightService` | Búsqueda y CRUD de vuelos | HTTP + `CacheService` + sessionStorage |
| `BookingService` | Gestión de reservas | HTTP + caché |
| `CacheService` | Caché en memoria del cliente | Key-value con TTL |

### Fase 4: Diseño UX/UI — Tema Oscuro y Polish (19-20 febrero)

**Commits:** 21 | **Tipo:** feat, fix

Esta fase representó la mayor concentración de trabajo iterativo, transformando la interfaz de un diseño básico a una experiencia visual profesional.

#### 4.1 Paleta de Colores

| Variable | Valor | Uso |
|----------|-------|-----|
| `--bg-primary` | `#0f0f23` | Fondo principal |
| `--bg-secondary` | `#1a1a2e` | Fondo secundario, gradientes |
| `--bg-card` | `#1e1e32` | Fondo de tarjetas |
| `--accent-primary` | `#ff6b6b` | Color coral principal |
| `--accent-secondary` | `#fe8a71` | Color coral secundario |
| `--text-primary` | `#ffffff` | Texto principal |
| `--text-secondary` | `#a0aec0` | Texto secundario |

#### 4.2 Evolución del Diseño (Cronológico)

| # | Cambio | Impacto |
|---|--------|---------|
| 1 | **Modern UI Redesign** — Estilo gradiente base | Estableció la identidad visual |
| 2 | **Glassmorphism Navbar** — Efecto vidrio con blur | Navbar premium con `backdrop-filter` |
| 3 | **Paleta Oscura** — Cambio completo a dark theme | Fondo `#0f0f23`, todos los componentes |
| 4 | **Tema oscuro global** — Material Design overrides | 50+ reglas CSS `!important` para forzar texto blanco en TODOS los componentes Material |
| 5 | **Avatar circular** — Botón de usuario rediseñado | Inicial del nombre + dot online + gradiente coral |
| 6 | **Dropdown bocadillo** — Menú con piquito tipo speech bubble | CSS `::before` pseudo-element como flecha |
| 7 | **Navbar spacing** — Max-width 1600px, padding equilibrado | Distribución visual profesional |
| 8 | **Panel de detalles oscuro** — Expandible, compacto | Fondo dark + datos del vuelo organizado |
| 9 | **Estado click = hover** — Tarjeta seleccionada | Borde coral + fondo destacado persistente |
| 10 | **Tarjetas de destinos con fotos** — Hero visual | 6 tarjetas con imágenes Unsplash de ciudades |
| 11 | **Centrado perfecto del Home** — Viewport fit | Flexbox vertical centering sin scroll |

#### 4.3 Overrides Globales de Material Design

Se creó un sistema de overrides en `styles.scss` (~246 líneas) que fuerza el tema oscuro en absolutamente todos los componentes de Angular Material:

- `mat-mdc-card` — Fondo oscuro, texto blanco
- `mat-mdc-menu-panel` — Fondo oscuro
- `mat-mdc-dialog-container` — Fondo oscuro
- `mat-mdc-form-field` — Labels y inputs blancos
- `mat-mdc-select` — Opciones con fondo oscuro
- `mat-mdc-checkbox`, `mat-mdc-radio-button` — Colores coral
- `mat-mdc-tab`, `mat-mdc-snack-bar` — Texto blanco
- Scrollbar personalizada — Track oscuro, thumb coral

### Fase 5: Búsqueda por Destino (20 febrero)

**Commits:** 2 | **Tipo:** feat

#### 5.1 Sistema de Mapeo Flexible

Se implementó un sistema de búsqueda por destino extremadamente flexible:

```typescript
destinationMap: { [key: string]: { departure: string, arrival: string } }
```

**40+ alias mapeados** incluyendo:
- Nombres de ciudades: "barcelona", "madrid", "londres", "roma", "paris", "nueva york"
- Códigos IATA: "BCN", "MAD", "LHR", "FCO", "CDG", "JFK"
- Nombres de aeropuertos: "el prat", "barajas", "heathrow", "fiumicino", "charles de gaulle"
- Variantes sin acentos: "paris" → París, "malaga" → Málaga

**Algoritmo `resolveDestination()`:**
1. Normaliza input (minúsculas, elimina acentos con RegExp `NFD`)
2. Busca coincidencia exacta en `destinationMap`
3. Busca coincidencia parcial (clave contiene input o input contiene clave)
4. Detecta patrón ruta directa: "MAD-BCN", "MAD BCN"
5. Si es código IATA de 3 letras, asume MAD como origen por defecto

#### 5.2 Tarjetas de Destinos Populares

6 tarjetas visuales con:
- **Imagen de fondo:** Fotografías reales de Unsplash (400x250)
- **Overlay gradiente:** De negro a transparente
- **Información:** Ruta (MAD → BCN), nombre de ciudad, precio orientativo
- **Hover:** `translateY(-4px) + scale(1.02)` + zoom imagen + overlay coral
- **Destinos:** Barcelona, Madrid, Londres, Roma, París, Nueva York

### Fase 6: Rebranding SitFly (20 febrero)

**Commits:** pendiente de commit

Se renombró la marca de "FlysSeats" a "SitFly" en todos los archivos del frontend:
- Logo: `<span class="logo-primary">Sit</span><span class="logo-accent">Fly</span>`
- Título HTML: `<title>SitFly - Flight Booking Platform</title>`
- Traducciones i18n (en/es)
- Comentarios en código
- Tests unitarios

---

## 4. Métricas del Sprint

### 4.1 Commits por Tipo

| Tipo | Cantidad | Porcentaje |
|------|----------|------------|
| `fix` | 29 | 44.6% |
| `feat` | 17 | 26.2% |
| `ci` | 4 | 6.2% |
| `docs` | 3 | 4.6% |
| `refactor` | 1 | 1.5% |
| `chore` | 1 | 1.5% |
| Otros (merge, trigger) | 10 | 15.4% |
| **Total** | **65** | **100%** |

### 4.2 Líneas de Código por Capa

| Capa | Archivos | Líneas | Porcentaje |
|------|----------|--------|------------|
| **Backend Python** | 18 | 2.739 | 30.2% |
| **Frontend (TS+HTML+SCSS)** | 48 | 5.909 | 65.1% |
| **Infraestructura (Terraform)** | 4 | 426 | 4.7% |
| **Total** | **70** | **~9.074** | **100%** |

### 4.3 Desglose Backend

| Módulo | Líneas |
|--------|--------|
| App Flask (app.py) | 342 |
| Configuración (config.py) | 104 |
| Cliente Amadeus | 368 |
| Cliente Cosmos DB | 422 |
| Cliente Redis | 172 |
| Utilidades vuelos | 57 |
| Modelos de dominio | 356 |
| Scripts operativos | 323 |
| Azure Functions (legacy) | 595 |

### 4.4 Archivos Modificados Totales

**141 archivos** modificados con **34.066 inserciones** desde el commit inicial.

---

## 5. Funcionalidades Entregadas

### 5.1 Funcionalidades Completas ✅

| ID | Funcionalidad | Frontend | Backend | Estado |
|----|--------------|----------|---------|--------|
| F1 | Búsqueda de vuelos reales (Amadeus) | ✅ | ✅ | **Operativa** |
| F2 | Búsqueda por destino flexible | ✅ | — | **Operativa** |
| F3 | Tarjetas de destinos populares | ✅ | — | **Operativa** |
| F4 | Vista previa expandible de vuelos | ✅ | — | **Operativa** |
| F5 | Registro de usuarios | ✅ | ✅ | **Operativa** |
| F6 | Login / Autenticación | ✅ | ✅ | **Operativa** |
| F7 | CRUD de vuelos | ✅ | ✅ | **Operativa** |
| F8 | Gestión de reservas | ✅ | ✅ | **Operativa** |
| F9 | Caché cliente (sessionStorage) | ✅ | — | **Operativa** |
| F10 | Internacionalización (EN/ES) | ✅ | — | **Operativa** |
| F11 | Tema oscuro completo | ✅ | — | **Operativa** |
| F12 | Diseño responsive (desktop + mobile) | ✅ | — | **Operativa** |
| F13 | Infraestructura Azure (Terraform) | — | — | **Desplegada** |
| F14 | CI/CD GitHub Actions | — | — | **Configurado** |

### 5.2 Funcionalidades Preparadas (Modelos listos, sin UI)

| ID | Funcionalidad | Modelo Backend | Modelo Frontend |
|----|--------------|----------------|-----------------|
| P1 | Intercambio de asientos (Swap) | `swap.py` | `SwapRequest`, `SwapParticipant` |
| P2 | Sistema de mensajería | `message.py` | `Message` |
| P3 | Valoraciones y ratings | `rating.py` | `Rating` |
| P4 | Gestión detallada de asientos | `seat.py` | `Seat`, `SeatDetails`, `SeatPreferences` |
| P5 | Reputación de usuario | `user.py` | `UserReputation` |

---

## 6. Decisiones Técnicas Relevantes

### 6.1 Migración Azure Functions → Flask

**Motivo:** Azure Functions v2 presentaba complejidad innecesaria para el alcance del TFM. Flask ofrece:
- Desarrollo local más ágil
- Debugging más sencillo
- Menor latencia (sin cold start de serverless)
- Mayor control sobre el ciclo de vida de la aplicación

**Impacto:** Se mantuvo `function_app.py` como referencia pero toda la lógica productiva está en `app.py`.

### 6.2 Patrón Singleton para Clientes

Tanto `CosmosDBClient`, `AmadeusClient` como `RedisClient` implementan el patrón Singleton mediante `__new__`, garantizando una única instancia por proceso y reutilización de conexiones.

### 6.3 Degradación Elegante de Redis

Redis está configurado como **opcional** (`REDIS_ENABLED=false` por defecto). Si la conexión falla o no está habilitada, todos los métodos devuelven `None`/`False` silenciosamente, sin interrumpir el funcionamiento de la aplicación.

### 6.4 Modelo Flight Dual

La interfaz `Flight` en el frontend soporta tanto el formato legacy de la aplicación como el formato de respuesta de la API de Amadeus, permitiendo un mapeo transparente sin transformaciones costosas.

### 6.5 Standalone Components

Todos los componentes de features (`LoginComponent`, `FlightSearchComponent`, `BookingsListComponent`) son **standalone**, no dependen de un módulo padre y declaran sus propias dependencias. Esto permite lazy loading granular por ruta.

### 6.6 Sistema de Diseño con Variables CSS

Se estableció un sistema de diseño centralizado con:
- Variables CSS globales (`:root`) para colores, radios, spacing
- Overrides globales de Material Design en `styles.scss`
- Estilos de componente encapsulados con `::ng-deep` solo donde es necesario

---

## 7. Problemas Encontrados y Soluciones

| # | Problema | Causa | Solución |
|---|----------|-------|----------|
| 1 | Error 500 en detalles de vuelo | Amadeus devuelve estructura diferente por vuelo | Optional chaining (`?.`) en todas las propiedades |
| 2 | Texto negro en componentes Material | Angular Material usa colores propios que ignoran el tema | 50+ overrides `!important` en `styles.scss` |
| 3 | Redis crash con None keys | Cache keys con valores undefined | Validación de parámetros antes de construir keys |
| 4 | Navbar scroll + footer fantasma | `min-height: 100vh` + `padding-top: 72px` = 100vh + 72px | `min-height: calc(100vh - 72px)` |
| 5 | Cold start lento en Azure Functions | Inicialización serverless | Migración a Flask + App Service (always-on) |
| 6 | TypeScript strict mode errores | Propiedades opcionales de Amadeus | `optional chaining` + `nullish coalescing` masivo |
| 7 | Búsqueda demasiado rígida | Solo aceptaba número de vuelo exacto | Sistema de mapeo flexible con 40+ alias |

---

## 8. Entorno de Despliegue

### 8.1 URLs de Producción

| Servicio | URL |
|----------|-----|
| **Backend API** | `https://flyseats2-dev-api.azurewebsites.net/api` |
| **Health Check** | `https://flyseats2-dev-api.azurewebsites.net/api/health` |
| **Frontend** | Ejecución local (`ng serve`) |

### 8.2 Configuración de Ambiente

| Variable | Valor | Almacenamiento |
|----------|-------|---------------|
| `AMADEUS_API_KEY` | `xe17wf...` | Azure App Settings |
| `AMADEUS_API_SECRET` | `6XpUb...` | Azure App Settings |
| `COSMOS_DB_CONNECTION` | Connection string | Azure App Settings |
| `REDIS_ENABLED` | `false` | Azure App Settings |

---

## 9. Conclusiones del Sprint 1

### Logros Principales
1. **Infraestructura Cloud completa** — Todos los recursos Azure provisionados y operativos
2. **Backend funcional** con datos reales de vuelos vía Amadeus API
3. **Frontend profesional** con tema oscuro, animaciones y UX pulida
4. **Modelos completos** para las funcionalidades futuras (swap, mensajería, ratings)
5. **Pipeline CI/CD** configurado y funcional

### Deuda Técnica Identificada
- Tests unitarios pendientes (solo spec base generado por Angular CLI)
- Tests e2e (Cypress configurado pero specs básicos)
- Validación de formularios más robusta
- Manejo de tokens JWT con expiración
- Variables de entorno sensibles deberían migrar completamente a Key Vault

### Preparación para Sprint 2
Los modelos de dominio ya incluyen las interfaces para:
- **Sistema de intercambio de asientos** (SwapRequest, SwapParticipant)
- **Mensajería entre usuarios** (Message)
- **Sistema de valoraciones** (Rating)
- **Gestión detallada de asientos** (Seat, SeatDetails, SeatPreferences)
- **Reputación de usuario** (UserReputation)

---

*Documento generado el 20 de febrero de 2026*  
*Sprint 1 — SitFly TFM*
