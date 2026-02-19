# Sprint 1 - Progress Report

## ✅ Completed Tasks

### 1. Setup Cosmos DB Client y Modelos
- ✅ Created Pydantic models for all entities:
  - `User` (profile, reputation)
  - `Flight` (departure, arrival, aircraft)
  - `Seat` (details, preferences, position)
  - `SwapRequest` (matching status)
  - `Message` (chat)
  - `Rating` (user reviews)
  
- ✅ Extended `CosmosDBClient` with new operations:
  - Flight CRUD operations
  - Seat CRUD operations
  - Search and filtering
  - Duplicate detection
  
- ✅ Cosmos DB Collections:
  - `users`
  - `flights`
  - `seats`
  - `swap_requests`
  - `messages`
  - `ratings`
  - `location_verifications`

### 2. Flight API Implementation
- ✅ **GET /api/flights** - Search flights
  - Query params: `flight_number`, `departure_code`, `arrival_code`, `date`
  - Returns filtered list of flights
  
- ✅ **POST /api/flights** - Create flight
  - Validates required fields
  - Checks for duplicates (same number + date + origin)
  - Generates unique ID: `flight_AA123_20260301_MAD`
  
- ✅ **GET /api/flights/{id}** - Get flight details
  
- ✅ **PUT /api/flights/{id}** - Update flight
  - Update status, participants count, etc.
  
- ✅ **DELETE /api/flights/{id}** - Delete flight

### 3. Seat API Implementation
- ✅ **GET /api/flights/{flight_id}/seats** - Get all seats for flight
  
- ✅ **POST /api/flights/{flight_id}/seats** - Join flight with seat
  - Validates seat number format (e.g., 12A)
  - Checks seat availability
  - Prevents duplicate seats for same user
  - Auto-detects seat type (WINDOW/AISLE/MIDDLE)
  - Auto-detects seat section (FRONT/MIDDLE/BACK)
  - Updates flight participants count
  
- ✅ **GET /api/seats/{id}** - Get seat details
  
- ✅ **PUT /api/seats/{id}** - Update seat preferences
  
- ✅ **DELETE /api/seats/{id}** - Leave flight

### 4. Utility Functions
- ✅ `generate_flight_id()` - Create unique flight identifiers
- ✅ `generate_seat_id()` - Create unique seat identifiers
- ✅ `parse_seat_number()` - Extract row and column from seat number
- ✅ `determine_seat_type()` - Classify as WINDOW/AISLE/MIDDLE
- ✅ `determine_seat_section()` - Classify as FRONT/MIDDLE/BACK

---

## 📊 Code Statistics

- **11 files changed**
- **1,094 insertions**
- **7 data models** created
- **10 API endpoints** implemented
- **20+ database operations** added

---

## 🧪 Testing

### Prerequisites
```bash
cd ~/TFM/TFM-FlysSeats/backend
pip install -r requirements.txt
```

### Start Backend Locally
```bash
func start --python
```

### Test Endpoints

#### 1. Create a Flight
```bash
curl -X POST http://localhost:7071/api/flights \
  -H "Content-Type: application/json" \
  -d '{
    "flight_number": "IB2345",
    "airline": "Iberia",
    "departure": {
      "airport_code": "MAD",
      "airport_name": "Madrid-Barajas",
      "city": "Madrid",
      "country": "Spain",
      "date": "2026-03-15",
      "time": "10:00:00",
      "timezone": "Europe/Madrid",
      "coordinates": {"lat": 40.4719, "lon": -3.5626}
    },
    "arrival": {
      "airport_code": "BCN",
      "airport_name": "Barcelona-El Prat",
      "city": "Barcelona",
      "country": "Spain",
      "date": "2026-03-15",
      "time": "11:30:00",
      "timezone": "Europe/Madrid"
    },
    "aircraft": {
      "model": "Airbus A320",
      "total_seats": 180
    },
    "created_by": "user_test123"
  }'
```

#### 2. Search Flights
```bash
curl "http://localhost:7071/api/flights?flight_number=IB2345&date=2026-03-15"
```

#### 3. Join Flight with Seat
```bash
curl -X POST http://localhost:7071/api/flights/flight_IB2345_20260315_MAD/seats \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_test123",
    "seat_number": "12A",
    "preferences": {
      "desired_type": ["WINDOW", "AISLE"],
      "desired_section": "FRONT",
      "together_seats": 0,
      "importance_weights": {
        "seat_type": 5,
        "section": 3
      }
    },
    "open_to_swap": true
  }'
```

#### 4. Get Flight Seats
```bash
curl "http://localhost:7071/api/flights/flight_IB2345_20260315_MAD/seats"
```

---

## 🚧 Next Steps - Sprint 1 Completion

### ⏳ Remaining Tasks

#### 4. Frontend: Flight Search/Create Service
- Create `flight.service.ts` with API methods
- Implement search, create, get operations
- Add error handling and loading states

#### 5. Frontend: Flight Search/Create Components
- `flight-search.component.ts` - Search form
- `flight-create.component.ts` - Create flight form
- `flight-list.component.ts` - Display search results
- `flight-detail.component.ts` - Flight details view

#### 6. Frontend: Join Flight Component
- `flight-join.component.ts` - Seat selection + preferences
- Seat map visualization (optional)
- Preference sliders/inputs

#### 7. Testing & Integration
- Unit tests for backend functions
- Integration tests for APIs
- E2E tests for workflow
- Deploy backend to Azure

---

## 📅 Time Estimate

- **Tasks 4-6**: 2-3 days (Frontend implementation)
- **Task 7**: 1-2 days (Testing)
- **Total Sprint 1**: ~5-7 días

---

## 🎯 Success Criteria

Sprint 1 will be complete when:
- ✅ Users can search for existing flights
- ✅ Users can create new flights
- ✅ Users can join a flight with their seat
- ✅ Users can specify swap preferences
- ✅ All APIs are working in Azure
- ✅ Frontend is deployed and accessible

---

**Current Status**: 50% Complete (Backend done, Frontend pending)
