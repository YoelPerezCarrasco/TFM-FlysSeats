# Sprint 2 — Informe de Desarrollo

## Proyecto: SitFly (TFM)
### Trabajo Fin de Máster — Plataforma de Reserva e Intercambio de Asientos

**Período del Sprint:** 20 febrero 2026 — 15 marzo 2026  
**Enfoque funcional:** Preferencias de asiento, matching e intercambios  
**Resultado:** Sprint completado con backend, frontend y flujo local-first operativo

---

## 1. Objetivos del Sprint 2

1. Implementar gestión de asientos por vuelo (alta, consulta, actualización y baja).
2. Implementar matching de intercambio basado en preferencias y reputación.
3. Implementar ciclo de vida completo de solicitudes de intercambio (crear, aceptar, rechazar, completar).
4. Exponer UI de sugerencias y gestión de intercambios en Angular.
5. Reducir dependencia cloud para poder continuar desarrollo sin suscripción activa.

---

## 2. Alcance funcional implementado

### 2.1 Backend — Nuevos endpoints Sprint 2

Se implementaron 12 endpoints nuevos en `backend/app.py` para cubrir asientos, matching y swaps:

| Área | Método | Endpoint | Estado |
|------|--------|----------|--------|
| Seats | GET | `/api/flights/<flight_id>/seats` | ✅ |
| Seats | POST | `/api/flights/<flight_id>/seats` | ✅ |
| Seats | GET | `/api/seats/<seat_id>` | ✅ |
| Seats | PUT | `/api/seats/<seat_id>/preferences` | ✅ |
| Seats | DELETE | `/api/seats/<seat_id>` | ✅ |
| Matching | GET | `/api/flights/<flight_id>/matching?user_id=` | ✅ |
| Swaps | POST | `/api/swaps` | ✅ |
| Swaps | GET | `/api/swaps/<swap_id>` | ✅ |
| Swaps | POST | `/api/swaps/<swap_id>/accept` | ✅ |
| Swaps | POST | `/api/swaps/<swap_id>/reject` | ✅ |
| Swaps | GET | `/api/swaps/user/<user_id>` | ✅ |
| Swaps | GET | `/api/flights/<flight_id>/swaps` | ✅ |

### 2.2 Motor de matching

Se implementó `backend/utils/matching_engine.py` con algoritmo de score compuesto por 4 factores:

- **Preferencias:** 40%
- **Reputación:** 30%
- **Tiempo de espera:** 20%
- **Proximidad del asiento:** 10%

Características técnicas relevantes:
- Score normalizado en rango 0–100.
- Penalización de compatibilidad unilateral mediante combinación geométrica.
- Ordenación de sugerencias y límite configurable (`limit`).

### 2.3 Persistencia Cosmos / repositorio

Se amplió `backend/utils/cosmos_client.py` para soportar entidad `swaps`:
- `get_swap`
- `create_swap`
- `update_swap`
- `get_user_swaps`
- `get_flight_swaps`

También se añadieron contenedores en IaC para coherencia del modelo de datos:
- `seats`
- `swaps`

### 2.4 Frontend — Módulo de intercambios

Se incorporó módulo funcional de swaps en Angular:

- Rutas: `flyseats-frontend/src/app/features/swaps/swaps.routes.ts`
- Servicio: `core/services/swap.service.ts`
- Pantalla de sugerencias: `swap-suggestions/*`
- Pantalla de gestión de intercambios: `swap-list/*`
- Integración de navegación en menú desktop/móvil
- Ruta lazy cargada en `app-routing.module.ts` (`/swaps`)

#### Funcionalidades de UI entregadas

- Listado por estado: Activos / Completados / Rechazados.
- Indicadores visuales de score y estado.
- Flujo de aceptación/rechazo con feedback de usuario.
- Visualización de confirmación dual (requester/partner).

---

## 3. Cambio estratégico de arquitectura operativa (coste y continuidad)

Durante el sprint se detectó sobrecoste en Cosmos DB y bloqueo de suscripción educativa. Para garantizar continuidad del TFM:

### 3.1 Local-first habilitado

Se incorporó modo local sin Azure:

- `backend/utils/local_db_client.py` (persistencia JSON local)
- `backend/config.py` con `LOCAL_MODE=true`
- `backend/app.py` con selección dinámica de cliente (`LocalDBClient` o `CosmosDBClient`)
- `.env.example` para arranque local
- `scripts/dev.sh` y `Makefile` (`make dev`) para levantar backend+frontend en un comando

### 3.2 CI/CD mantenido sin dependencia fuerte de Azure

- Workflow backend convertido a **CI en push** + **deploy Azure solo manual**.
- Health-check remoto convertido a ejecución manual y opcional por secret `HEALTH_CHECK_URL`.

### 3.3 Infraestructura Terraform ajustada

- Cosmos configurado en modo serverless en IaC (si se retoma Azure).
- Variables y recursos actualizados para reflejar el nuevo modelo.

---

## 4. Validación realizada

### 4.1 Validación técnica

- Compilación Python OK (`py_compile`) en modo local.
- Health endpoint local OK (`/api/health`, HTTP 200).
- Smoke test end-to-end (usuarios, vuelo, seats, swaps) completado correctamente.

### 4.2 Flujo funcional verificado

1. Registro/Login de dos usuarios.
2. Creación de vuelo.
3. Alta de asientos y preferencias.
4. Creación de solicitud de swap.
5. Consulta de swaps por usuario.

Resultado: **funcionamiento correcto en entorno local sin Azure**.

---

## 5. Métricas del Sprint 2 (núcleo funcional)

| Archivo / Módulo | LOC |
|------------------|-----|
| `backend/app.py` | 718 |
| `backend/utils/cosmos_client.py` | 501 |
| `backend/utils/matching_engine.py` | 269 |
| `backend/utils/local_db_client.py` | 253 |
| `frontend/core/services/swap.service.ts` | 142 |
| `swap-suggestions.component.ts` | 155 |
| `swap-list.component.ts` | 175 |
| **Total núcleo medido** | **2.213** |

---

## 6. Riesgos y deuda técnica identificada

1. **Sin autenticación JWT real en endpoints sensibles** (se usa `user_id` en payload para flujo demo).
2. **Persistencia local JSON** válida para desarrollo, no para concurrencia/producción.
3. **Warnings de plantillas Angular** pendientes de limpieza en algunos componentes.
4. **Documentación histórica** todavía mezcla referencias antiguas (Azure Functions vs Flask actual).

---

## 7. Conclusión del Sprint 2

Sprint 2 se considera **completado** con entrega de funcionalidades clave de intercambio de asientos y matching, incluyendo UI operativa, endpoints completos y validación de flujo extremo a extremo.

Además, se añadió un resultado estratégico crítico para el TFM: **continuidad del desarrollo sin dependencia de suscripción Azure**, manteniendo capacidad de CI y posibilidad de retomar cloud cuando sea viable.

---

## 8. Evidencias (archivos principales)

- Backend API y lógica de sprint: `backend/app.py`
- Algoritmo matching: `backend/utils/matching_engine.py`
- Persistencia cloud: `backend/utils/cosmos_client.py`
- Persistencia local-first: `backend/utils/local_db_client.py`
- Servicio frontend swaps: `flyseats-frontend/src/app/core/services/swap.service.ts`
- UI sugerencias: `flyseats-frontend/src/app/features/swaps/swap-suggestions/*`
- UI gestión swaps: `flyseats-frontend/src/app/features/swaps/swap-list/*`
- Rutas swaps: `flyseats-frontend/src/app/features/swaps/swaps.routes.ts`
- Arranque local: `scripts/dev.sh`, `Makefile`
