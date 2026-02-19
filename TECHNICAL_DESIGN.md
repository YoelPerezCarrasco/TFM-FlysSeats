# Diseño Técnico - FlysSeats

## 🗄️ Modelo de Datos (Cosmos DB)

### Collection: `users`

```json
{
  "id": "user_12345",
  "type": "user",
  "email": "juan@example.com",
  "name": "Juan Pérez",
  "phone": "+34600123456",
  "profile": {
    "avatar_url": "https://...",
    "bio": "Viajero frecuente",
    "preferred_language": "es"
  },
  "reputation": {
    "rating": 4.7,
    "total_reviews": 23,
    "total_swaps": 25,
    "completed_swaps": 23,
    "cancelled_swaps": 2,
    "percentage_completed": 92
  },
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-02-19T15:30:00Z"
}
```

### Collection: `flights`

```json
{
  "id": "flight_AA123_20260301_MAD",
  "type": "flight",
  "flight_number": "AA123",
  "airline": "American Airlines",
  "departure": {
    "airport_code": "MAD",
    "airport_name": "Adolfo Suárez Madrid-Barajas",
    "city": "Madrid",
    "country": "Spain",
    "date": "2026-03-01",
    "time": "10:00",
    "timezone": "Europe/Madrid",
    "coordinates": {
      "lat": 40.4719,
      "lon": -3.5626
    }
  },
  "arrival": {
    "airport_code": "JFK",
    "airport_name": "John F. Kennedy International",
    "city": "New York",
    "country": "USA",
    "date": "2026-03-01",
    "time": "13:30",
    "timezone": "America/New_York"
  },
  "aircraft": {
    "model": "Boeing 777-300ER",
    "total_seats": 350,
    "seat_map_url": "https://..."
  },
  "created_by": "user_12345",
  "participants_count": 15,
  "active_swaps_count": 8,
  "status": "upcoming",  // upcoming, boarding, departed, cancelled
  "created_at": "2026-02-15T10:00:00Z",
  "updated_at": "2026-02-19T15:30:00Z"
}
```

### Collection: `seats`

```json
{
  "id": "seat_AA123_20260301_12A",
  "type": "seat",
  "flight_id": "flight_AA123_20260301_MAD",
  "user_id": "user_12345",
  "seat_number": "12A",
  "seat_details": {
    "type": "WINDOW",          // WINDOW, AISLE, MIDDLE
    "section": "FRONT",         // FRONT, MIDDLE, BACK
    "row": 12,
    "column": "A",
    "is_emergency_exit": false,
    "is_reclinable": true,
    "extra_legroom": false
  },
  "preferences": {
    "desired_type": ["AISLE", "WINDOW"],
    "desired_section": "MIDDLE",
    "together_seats": 0,
    "emergency_exit": false,
    "importance_weights": {
      "seat_type": 5,
      "section": 3,
      "together_seats": 0,
      "emergency_exit": 2
    }
  },
  "open_to_swap": true,
  "created_at": "2026-02-15T10:00:00Z",
  "updated_at": "2026-02-19T15:30:00Z"
}
```

### Collection: `swap_requests`

```json
{
  "id": "swap_xyz789",
  "type": "swap_request",
  "flight_id": "flight_AA123_20260301_MAD",
  "requester": {
    "user_id": "user_12345",
    "current_seat": "12A",
    "seat_id": "seat_AA123_20260301_12A"
  },
  "partner": {
    "user_id": "user_67890",
    "current_seat": "15C",
    "seat_id": "seat_AA123_20260301_15C"
  },
  "match_score": 87.5,
  "status": "pending",  // pending, accepted, rejected, completed, expired
  "created_by": "algorithm",  // algorithm, user_12345 (manual request)
  "messages_count": 3,
  "requester_confirmed": false,
  "partner_confirmed": false,
  "expires_at": "2026-02-28T08:00:00Z",  // 2h antes del vuelo
  "created_at": "2026-02-19T15:30:00Z",
  "updated_at": "2026-02-19T16:45:00Z"
}
```

### Collection: `messages`

```json
{
  "id": "msg_abc123",
  "type": "message",
  "swap_request_id": "swap_xyz789",
  "sender_id": "user_12345",
  "receiver_id": "user_67890",
  "content": "Hola, ¿te gustaría intercambiar asientos?",
  "read": false,
  "created_at": "2026-02-19T15:35:00Z"
}
```

### Collection: `ratings`

```json
{
  "id": "rating_def456",
  "type": "rating",
  "swap_request_id": "swap_xyz789",
  "flight_id": "flight_AA123_20260301_MAD",
  "reviewer_id": "user_12345",
  "reviewee_id": "user_67890",
  "rating": 5,
  "comment": "Excelente comunicación, intercambio sin problemas",
  "created_at": "2026-03-01T20:00:00Z"
}
```

### Collection: `location_verifications`

```json
{
  "id": "loc_ghi789",
  "type": "location_verification",
  "user_id": "user_12345",
  "flight_id": "flight_AA123_20260301_MAD",
  "location": {
    "lat": 40.4735,
    "lon": -3.5628,
    "accuracy_meters": 50
  },
  "distance_to_airport_km": 1.2,
  "verified": true,
  "verified_at": "2026-03-01T07:30:00Z"
}
```

---

## 🎨 Nuevas Pantallas Frontend

### 1. Dashboard Principal
**Ruta**: `/dashboard`
- Lista de vuelos del usuario
- Próximos vuelos con estado de swap
- Notificaciones de matches nuevos

### 2. Crear/Buscar Vuelo
**Ruta**: `/flights/search` , `/flights/create`
- Formulario de búsqueda (número vuelo, fecha, origen, destino)
- Botón "Mi vuelo no está listado" → Crear vuelo
- Mapa mostrando vuelos cercanos (geolocalización)

### 3. Detalles del Vuelo
**Ruta**: `/flights/:id`
- Información del vuelo
- Mapa de asientos (visual)
- Botón "Unirme a este vuelo"

### 4. Seleccionar Asiento y Preferencias
**Ruta**: `/flights/:id/join`
- Input: Número de asiento actual
- Selector: Preferencias (ventanilla, pasillo, etc.)
- Sliders: Importancia de cada preferencia
- Botón "Buscar intercambios"

### 5. Matches Sugeridos
**Ruta**: `/swaps/suggestions`
- Cards con matches ordenados por score
- Para cada match:
  - Foto y nombre del otro usuario
  - Rating y número de intercambios
  - Asiento actual vs asiento propuesto
  - Botón "Enviar mensaje" / "Aceptar"

### 6. Mis Intercambios
**Ruta**: `/swaps/my-swaps`
- Lista de swaps activos
- Estados: Pendiente, En negociación, Aceptado, Completado
- Acceso rápido a mensajes

### 7. Chat
**Ruta**: `/swaps/:id/chat`
- Mensajería 1-a-1
- Info del swap en sidebar
- Botones: "Aceptar intercambio" / "Rechazar"

### 8. Perfil de Usuario
**Ruta**: `/profile/:id`
- Datos personales (editable si es propio perfil)
- Rating y estadísticas
- Historial de intercambios
- Reviews recibidas

### 9. Valorar Usuario
**Ruta**: `/swaps/:id/rate`
- Selector de estrellas (1-5)
- Textarea: Comentario opcional
- Aparece después del vuelo

---

## 🔌 APIs Backend (Azure Functions)

### Flights API

```python
# GET /api/flights?search=AA123&date=2026-03-01
# GET /api/flights/nearby?lat=40.4719&lon=-3.5626&radius=50
# GET /api/flights/:id
# POST /api/flights
# PUT /api/flights/:id
# DELETE /api/flights/:id
```

### Seats API

```python
# GET /api/flights/:flight_id/seats
# GET /api/seats/:id
# POST /api/seats  (join flight with seat)
# PUT /api/seats/:id  (update preferences)
# DELETE /api/seats/:id  (leave flight)
```

### Swaps API

```python
# GET /api/swaps/my-swaps  (swaps del usuario autenticado)
# GET /api/swaps/suggestions  (matches sugeridos)
# GET /api/swaps/:id
# POST /api/swaps  (crear solicitud manual)
# PUT /api/swaps/:id/accept
# PUT /api/swaps/:id/reject
# PUT /api/swaps/:id/complete
```

### Matching API (Algoritmo)

```python
# POST /api/matching/run  (ejecutar matching manual - admin)
# GET /api/matching/status  (estado del último run)

# Azure Function Timer (automático cada 10 min)
@app.timer_trigger(schedule="0 */10 * * * *")
def run_matching_algorithm(timer):
    # 1. Obtener todas las swap_requests con status=pending
    # 2. Agrupar por flight_id
    # 3. Ejecutar algoritmo de matching
    # 4. Crear swap_requests con matches encontrados
    # 5. Enviar notificaciones a usuarios
```

### Messages API

```python
# GET /api/swaps/:swap_id/messages
# POST /api/swaps/:swap_id/messages
# PUT /api/messages/:id/read
```

### Ratings API

```python
# GET /api/users/:user_id/ratings
# POST /api/ratings
# GET /api/swaps/:swap_id/ratings
```

### Location API

```python
# POST /api/location/verify
# Body: { user_id, flight_id, lat, lon }
# Response: { verified: true/false, distance_km: 1.2 }
```

---

## 🧮 Algoritmo de Matching - Implementación

```python
# backend/functions/matching/algorithm.py

from dataclasses import dataclass
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
import math

@dataclass
class SeatInfo:
    seat_id: str
    user_id: str
    seat_number: str
    seat_type: str  # WINDOW, AISLE, MIDDLE
    section: str    # FRONT, MIDDLE, BACK
    row: int
    column: str

@dataclass
class Preferences:
    desired_types: List[str]
    desired_section: str
    together_seats: int
    importance_weights: Dict[str, int]

@dataclass
class SwapRequest:
    user_id: str
    seat: SeatInfo
    preferences: Preferences
    user_rating: float
    user_swaps_count: int
    created_at: datetime

class MatchingAlgorithm:
    
    def __init__(self):
        self.MATCH_THRESHOLD = 65  # Mínimo 65/100 para sugerir match
        
    def find_matches(self, requests: List[SwapRequest]) -> List[Dict]:
        """Encuentra los mejores matches para un conjunto de solicitudes."""
        matches = []
        processed = set()
        
        # Ordenar por prioridad (rating + antiguedad)
        sorted_requests = sorted(
            requests, 
            key=lambda r: (r.user_rating, r.created_at),
            reverse=True
        )
        
        for i, req_a in enumerate(sorted_requests):
            if req_a.user_id in processed:
                continue
                
            best_match = None
            best_score = self.MATCH_THRESHOLD
            
            for req_b in sorted_requests[i+1:]:
                if req_b.user_id in processed:
                    continue
                    
                score = self.calculate_match_score(req_a, req_b)
                
                if score > best_score:
                    best_score = score
                    best_match = req_b
            
            if best_match:
                matches.append({
                    'requester': req_a.user_id,
                    'partner': best_match.user_id,
                    'score': best_score,
                    'seats': {
                        req_a.user_id: best_match.seat.seat_number,
                        best_match.user_id: req_a.seat.seat_number
                    }
                })
                processed.add(req_a.user_id)
                processed.add(best_match.user_id)
        
        return matches
    
    def calculate_match_score(self, req_a: SwapRequest, req_b: SwapRequest) -> float:
        """Calcula score de compatibilidad (0-100)."""
        
        # 1. Compatibilidad de preferencias (40 puntos)
        pref_score = self._calculate_preference_score(req_a, req_b)
        
        # 2. Reputación (30 puntos)
        reputation_score = self._calculate_reputation_score(req_a, req_b)
        
        # 3. Tiempo de espera (20 puntos)
        wait_score = self._calculate_wait_score(req_a, req_b)
        
        # 4. Proximidad de asientos (10 puntos)
        proximity_score = self._calculate_proximity_score(req_a.seat, req_b.seat)
        
        total = pref_score + reputation_score + wait_score + proximity_score
        return round(total, 2)
    
    def _calculate_preference_score(self, req_a: SwapRequest, req_b: SwapRequest) -> float:
        """Calcula compatibilidad de preferencias (0-40)."""
        score = 0.0
        
        # ¿El asiento de B cumple las preferencias de A?
        if req_b.seat.seat_type in req_a.preferences.desired_types:
            score += 15 * (req_a.preferences.importance_weights.get('seat_type', 3) / 5)
        
        if req_b.seat.section == req_a.preferences.desired_section:
            score += 5 * (req_a.preferences.importance_weights.get('section', 3) / 5)
        
        # ¿El asiento de A cumple las preferencias de B?
        if req_a.seat.seat_type in req_b.preferences.desired_types:
            score += 15 * (req_b.preferences.importance_weights.get('seat_type', 3) / 5)
        
        if req_a.seat.section == req_b.preferences.desired_section:
            score += 5 * (req_b.preferences.importance_weights.get('section', 3) / 5)
        
        return min(score, 40)
    
    def _calculate_reputation_score(self, req_a: SwapRequest, req_b: SwapRequest) -> float:
        """Calcula score basado en reputación (0-30)."""
        avg_rating = (req_a.user_rating + req_b.user_rating) / 2
        avg_swaps = (req_a.user_swaps_count + req_b.user_swaps_count) / 2
        
        rating_score = (avg_rating / 5) * 20
        experience_score = min(avg_swaps / 10, 1) * 10
        
        return rating_score + experience_score
    
    def _calculate_wait_score(self, req_a: SwapRequest, req_b: SwapRequest) -> float:
        """Calcula score por tiempo de espera (0-20)."""
        now = datetime.utcnow()
        
        wait_a = (now - req_a.created_at).total_seconds() / 3600  # horas
        wait_b = (now - req_b.created_at).total_seconds() / 3600
        
        max_wait = max(wait_a, wait_b)
        
        # Máximo 20 puntos si lleva esperando 24h o más
        return min(max_wait / 24, 1) * 20
    
    def _calculate_proximity_score(self, seat_a: SeatInfo, seat_b: SeatInfo) -> float:
        """Calcula score por proximidad de asientos (0-10)."""
        row_distance = abs(seat_a.row - seat_b.row)
        
        # Columnas: A=0, B=1, C=2, D=3, E=4, F=5
        col_map = {c: i for i, c in enumerate('ABCDEFGHIJK')}
        col_distance = abs(col_map[seat_a.column] - col_map[seat_b.column])
        
        # Distancia euclidiana
        distance = math.sqrt(row_distance**2 + col_distance**2)
        
        # Normalizar (asientos muy lejanos = 0 puntos)
        max_distance = 30  # ej: 30 filas de distancia
        normalized = 1 - min(distance / max_distance, 1)
        
        return normalized * 10
```

---

## 📱 Componentes Angular

### Estructura de Carpetas Propuesta

```
src/app/
├── core/
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── flight.service.ts
│   │   ├── seat.service.ts
│   │   ├── swap.service.ts
│   │   ├── matching.service.ts
│   │   ├── message.service.ts
│   │   ├── rating.service.ts
│   │   ├── location.service.ts
│   │   └── notification.service.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── location.guard.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts
│   └── models/
│       ├── user.model.ts
│       ├── flight.model.ts
│       ├── seat.model.ts
│       ├── swap.model.ts
│       ├── message.model.ts
│       └── rating.model.ts
├── features/
│   ├── auth/
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/
│   │   └── dashboard.component.ts
│   ├── flights/
│   │   ├── flight-search/
│   │   ├── flight-create/
│   │   ├── flight-detail/
│   │   └── flight-join/
│   ├── swaps/
│   │   ├── swap-suggestions/
│   │   ├── my-swaps/
│   │   ├── swap-detail/
│   │   └── swap-chat/
│   ├── profile/
│   │   └── user-profile/
│   └── ratings/
│       └── rate-user/
└── shared/
    ├── components/
    │   ├── seat-map/
    │   ├── rating-stars/
    │   ├── user-card/
    │   ├── swap-card/
    │   └── location-picker/
    └── pipes/
        ├── distance.pipe.ts
        └── seat-type.pipe.ts
```

---

## 🔐 Seguridad y Validaciones

### Validaciones Backend
1. **Creación de vuelo**: No permitir duplicados
2. **Unirse a vuelo**: Verificar que vuelo no haya partido
3. **Solicitar swap**: Verificar ubicación cercana al aeropuerto
4. **Confirmar swap**: Ambos usuarios deben confirmar
5. **Valorar**: Solo después del vuelo, una vez por swap

### Validaciones Frontend
1. **Números de asiento**: Validar formato (12A, 3D, etc.)
2. **Fechas**: No permitir vuelos pasados
3. **Ubicación**: Solicitar permisos de geolocalización
4. **Chat**: Sanitizar mensajes (evitar XSS)

---

## 🚀 Roadmap de Implementación

### Sprint 1 (Días 1-7): Fundamentos
- [ ] Setup Cosmos DB collections
- [ ] API: CRUD flights
- [ ] API: CRUD seats
- [ ] Frontend: Flight search/create
- [ ] Frontend: Flight detail
- [ ] Frontend: Join flight with seat selection

### Sprint 2 (Días 8-14): Preferencias y Matching
- [ ] Modelo de preferencias completo
- [ ] Frontend: Preference selector (con sliders)
- [ ] Algoritmo de matching (implementación básica)
- [ ] Azure Function timer (cada 10 min)
- [ ] API: Get swap suggestions
- [ ] Frontend: Swap suggestions page

### Sprint 3 (Días 15-21): Mensajería
- [ ] API: Messages CRUD
- [ ] Frontend: Chat component
- [ ] Polling service (cada 5 seg)
- [ ] Notificaciones visuales
- [ ] Aceptar/Rechazar swaps

### Sprint 4 (Días 22-28): Reputación
- [ ] API: Ratings CRUD
- [ ] Frontend: Rate user page
- [ ] User profile con ratings
- [ ] Historial de swaps
- [ ] Dashboard con stats

### Sprint 5 (Días 29-35): Geolocalización
- [ ] Integración Azure Maps
- [ ] API: Location verification
- [ ] Frontend: Location permission
- [ ] Guard: Verificar ubicación antes de swap
- [ ] Mapa de vuelos cercanos

### Sprint 6 (Días 36-42): Pulido
- [ ] Tests unitarios (Jest)
- [ ] Tests E2E (Cypress)
- [ ] Optimización de rendimiento
- [ ] Documentación
- [ ] Deploy a producción

---

**Total estimado**: 6 semanas (42 días)

¿Comenzamos con el Sprint 1?
