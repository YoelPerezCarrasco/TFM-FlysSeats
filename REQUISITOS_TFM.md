# Requisitos del TFM - FlysSeats

## 🎯 Concepto Principal

**FlysSeats** es una plataforma para **intercambiar asientos de avión** entre pasajeros del mismo vuelo, optimizando la satisfacción de todos mediante un algoritmo inteligente.

Similar a BlaBlaCar, pero para intercambio de asientos en vuelos.

---

## 📋 Requisitos Funcionales

### 1. Gestión de Usuarios
- ✅ Registro y autenticación
- ⏳ Perfil de usuario con:
  - Datos personales
  - **Valoración/rating** (0-5 estrellas)
  - Historial de intercambios realizados
  - Estadísticas (% intercambios exitosos)

### 2. Gestión de Vuelos
- ⏳ **Crear vuelo** (cualquier usuario puede):
  - Número de vuelo
  - Fecha y hora
  - Ciudad origen
  - Ciudad destino
  - **Validación**: No permitir duplicados (misma fecha + hora + número + origen)
  
- ⏳ **Buscar vuelos**:
  - Por fecha/destino
  - **Por ubicación cercana** (geolocalización)
  
- ⏳ **Unirse a vuelo**:
  - Indicar número de asiento actual (ej: 12A)
  - Especificar preferencias de intercambio

### 3. Preferencias de Asientos

#### Tipos de asiento:
- **Ventanilla** (Window)
- **Pasillo** (Aisle)  
- **Central/Medio** (Middle)

#### Preferencias adicionales:
- **Asientos juntos**: "Quiero X asientos juntos" (para grupos/familias)
- **Ubicación en avión**:
  - Front (adelante)
  - Middle (medio)
  - Back (atrás)
- **Características especiales**:
  - Salida de emergencia (más espacio)
  - No reclinable
  - Cerca de baños
  - Cerca de cocina

#### Prioridad de preferencias:
Usuario puede ranquear importancia (1-5) de cada preferencia.

### 4. Sistema de Intercambio

#### Restricciones:
- ⏳ **Proximidad geográfica**: Solo usuarios cercanos al aeropuerto pueden intercambiar
  - Verificar ubicación del usuario
  - Establecer radio (ej: 50km del aeropuerto)
  - Verificar X horas antes del vuelo (ej: 24h-2h antes)

#### Proceso:
1. Usuario solicita intercambio (especifica preferencias)
2. **Algoritmo de matching** encuentra coincidencias
3. **Mensajería** entre usuarios para negociar
4. Confirmación de ambas partes
5. Intercambio realizado
6. **Valoración mutua** post-vuelo

### 5. Sistema de Mensajería
- ⏳ Chat 1-a-1 entre usuarios
- Notificaciones de nuevos mensajes
- Historial de conversación
- Tiempo real o polling

### 6. Algoritmo de Optimización

#### Estrategia a decidir:
**Opción A: Por demanda (bajo demanda)**
- Cuando usuario solicita intercambio, buscar matches inmediatos
- Ventajas: Respuesta rápida
- Desventajas: Menos combinaciones posibles

**Opción B: Por lotes (batch processing)**
- Cada X minutos (ej: cada 10 min), procesar todas las peticiones pendientes
- Ventajas: Más combinaciones, mejor optimización global
- Desventajas: Usuario espera más tiempo

**Propuesta**: **Híbrido**
- Búsqueda inicial inmediata (matches obvios)
- Re-optimización cada 10-15 minutos
- Notificar nuevas oportunidades

#### Factores del algoritmo:
1. **Compatibilidad de preferencias** (peso: 40%)
   - Match perfecto: +100 puntos
   - Mejora mutua: +80 puntos
   - Mejora unilateral: +40 puntos

2. **Reputación del usuario** (peso: 30%)
   - Rating promedio (0-5 estrellas)
   - Número de intercambios completados
   - % de intercambios cancelados (penalización)

3. **Tiempo de solicitud** (peso: 20%)
   - Priorizar solicitudes más antiguas
   - Evitar que usuarios esperen indefinidamente

4. **Proximidad de asientos** (peso: 10%)
   - Intercambios entre asientos cercanos son más fáciles
   - Menos disruptivo para otros pasajeros

---

## 🏗️ Arquitectura Técnica

### Stack Actual (mantener):
- **Frontend**: Angular 15+ (responsiva, PWA para móvil)
- **Backend**: Python + Azure Functions
- **Infraestructura**: Azure (App Service, Cosmos DB, etc.)
- **CI/CD**: GitHub Actions

### Componentes a Agregar:

#### Base de Datos:
- **Cosmos DB** (NoSQL, ya disponible en Azure)
  - Collections:
    - `users` (usuarios + ratings)
    - `flights` (vuelos)
    - `seats` (asientos + usuarios)
    - `swap_requests` (solicitudes de intercambio)
    - `messages` (mensajería)
    - `ratings` (valoraciones)

#### APIs Backend:
- `/api/flights` - CRUD vuelos
- `/api/seats` - Gestión de asientos
- `/api/swaps` - Solicitudes de intercambio
- `/api/matching` - Algoritmo de matching
- `/api/messages` - Chat
- `/api/ratings` - Sistema de valoración
- `/api/locations` - Verificación de proximidad

#### Servicios Externos:
- **Azure Maps / Google Maps**: Geolocalización
- **Azure SignalR** (opcional): Mensajería en tiempo real
- **Azure Functions Timer**: Batch processing cada X minutos

---

## 📊 Algoritmo de Matching - Propuesta

### Modelo de Preferencias

```python
class UserPreferences:
    seat_type: Enum[WINDOW, AISLE, MIDDLE]  # Prioridad 1
    location: Enum[FRONT, MIDDLE, BACK]     # Prioridad 2
    together_seats: int                      # Cuántos asientos juntos (0 = solo)
    emergency_exit: bool                     # ¿Quiere salida emergencia?
    importance_weights: dict                 # Peso de cada preferencia (1-5)

class SwapRequest:
    user_id: str
    flight_id: str
    current_seat: str                        # "12A"
    preferences: UserPreferences
    timestamp: datetime
    status: Enum[PENDING, MATCHED, COMPLETED, CANCELLED]
```

### Algoritmo (Pseudocódigo)

```python
def find_matches(pending_requests):
    """
    Algoritmo de matching para intercambio de asientos.
    Se ejecuta cada 10 minutos.
    """
    matches = []
    
    # Agrupar por vuelo (solo matchear mismo vuelo)
    requests_by_flight = group_by_flight(pending_requests)
    
    for flight_id, requests in requests_by_flight.items():
        # Ordenar por reputación + tiempo de espera
        sorted_requests = sort_by_priority(requests)
        
        # Para cada par de solicitudes
        for i, req_a in enumerate(sorted_requests):
            for req_b in sorted_requests[i+1:]:
                score = calculate_match_score(req_a, req_b)
                
                if score >= THRESHOLD:  # ej: 70/100
                    matches.append({
                        'users': [req_a.user_id, req_b.user_id],
                        'score': score,
                        'proposed_swap': {
                            req_a.user_id: req_b.current_seat,
                            req_b.user_id: req_a.current_seat
                        }
                    })
    
    # Optimización: Evitar solapamientos
    # Si A matchea con B y B matchea con C, elegir mejor match
    final_matches = resolve_conflicts(matches)
    
    return final_matches


def calculate_match_score(req_a, req_b):
    """
    Calcula score de compatibilidad (0-100).
    """
    score = 0
    
    # 1. Compatibilidad de preferencias (40 puntos)
    if seat_matches_preference(req_a.preferences, req_b.current_seat):
        score += 20
    if seat_matches_preference(req_b.preferences, req_a.current_seat):
        score += 20
    
    # 2. Reputación (30 puntos)
    avg_rating = (req_a.user_rating + req_b.user_rating) / 2
    score += (avg_rating / 5) * 30
    
    # 3. Tiempo de espera (20 puntos)
    max_wait = max(req_a.wait_time_hours, req_b.wait_time_hours)
    score += min(max_wait / 24, 1) * 20  # Max 24h = 20 puntos
    
    # 4. Proximidad de asientos (10 puntos)
    distance = calculate_seat_distance(req_a.current_seat, req_b.current_seat)
    score += (1 - distance/MAX_DISTANCE) * 10
    
    return score
```

---

## 🗓️ Plan de Desarrollo por Fases

### **Fase 1: Fundamentos** (Semana 1-2)
- [ ] Diseño de base de datos (modelos Cosmos DB)
- [ ] API de gestión de vuelos (CRUD)
- [ ] API de gestión de asientos
- [ ] Frontend: Página de creación/búsqueda de vuelos
- [ ] Frontend: Selección de asiento + preferencias

### **Fase 2: Sistema de Intercambio** (Semana 3-4)
- [ ] Modelo de preferencias completo
- [ ] API de solicitudes de intercambio
- [ ] Algoritmo de matching (versión básica)
- [ ] Frontend: Interfaz de solicitar intercambio
- [ ] Frontend: Ver matches sugeridos

### **Fase 3: Mensajería y Reputación** (Semana 5)
- [ ] Sistema de mensajería (polling o SignalR)
- [ ] Frontend: Chat entre usuarios
- [ ] Sistema de valoración/rating
- [ ] Frontend: Perfil de usuario con rating

### **Fase 4: Geolocalización** (Semana 6)
- [ ] Integración Azure Maps / Google Maps
- [ ] Verificación de proximidad al aeropuerto
- [ ] Frontend: Solicitar permiso de ubicación

### **Fase 5: Optimización y Testing** (Semana 7-8)
- [ ] Mejorar algoritmo de matching
- [ ] Azure Function con timer (batch processing)
- [ ] Tests unitarios backend
- [ ] Tests E2E frontend
- [ ] Optimización de rendimiento

---

## 🤔 Decisiones Pendientes

### 1. **Algoritmo**: ¿Bajo demanda o por lotes?
**Propuesta**: Híbrido (matching inmediato + re-optimización cada 10 min)

### 2. **Mensajería**: ¿Tiempo real o polling?
**Propuesta**: Polling cada 5 segundos (más simple, suficiente para este caso)

### 3. **Geolocalización**: ¿Cuándo verificar?
**Propuesta**: 24h antes del vuelo hasta 2h antes

### 4. **Base de datos**: ¿Cosmos DB o SQL?
**Propuesta**: Cosmos DB (NoSQL, mejor para este modelo, ya disponible)

### 5. **Móvil**: ¿PWA o aplicación nativa?
**Propuesta**: PWA con Capacitor (ya configurado, funciona en Android/iOS)

---

## 📝 Próximos Pasos

1. **Revisar estas propuestas** y aprobar decisiones técnicas
2. **Diseñar modelos de datos** (schema Cosmos DB)
3. **Crear wireframes/mockups** de las nuevas pantallas
4. **Implementar Fase 1**: Gestión de vuelos y asientos

---

¿Te parece bien este enfoque? ¿Alguna modificación a las propuestas?
