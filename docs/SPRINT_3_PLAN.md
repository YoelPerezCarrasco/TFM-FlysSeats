# Sprint 3 — Plan de Ejecución

## Proyecto: SitFly (TFM)
### Objetivo del Sprint 3: Robustez funcional, seguridad básica y calidad para defensa

**Estado de partida:** Sprint 2 completado (matching + swaps + modo local-first).  
**Duración estimada:** 2 semanas (10 días hábiles).  
**Enfoque:** cerrar brechas para entregar un MVP defendible y demostrable en local.

---

## 1. Objetivos del Sprint 3

1. **Asegurar el flujo de negocio** con autenticación mínima real (JWT) y control de acceso en endpoints críticos.
2. **Aumentar confianza técnica** con batería de pruebas automatizadas backend/frontend.
3. **Mejorar calidad de datos de matching** con ajustes de reputación y validaciones.
4. **Preparar demo final TFM** con documentación de operación local, casos de uso y checklist de defensa.

---

## 2. Alcance funcional (MVP Sprint 3)

### 2.1 Seguridad y autenticación

- Implementar emisión de JWT en login.
- Añadir middleware/guard backend para validar token en:
  - creación de booking
  - alta/baja de seat
  - creación/aceptación/rechazo de swaps
- Verificar que `user_id` del token coincide con el actor de la operación.

**Criterios de aceptación:**
- Requests sin token en endpoints protegidos ⇒ `401`.
- Token inválido/expirado ⇒ `401`.
- Usuario distinto al del recurso ⇒ `403`.

### 2.2 Calidad de matching y ciclo de swap

- Consolidar estructura de preferencias (tipado y normalización).
- Mejorar reglas de reputación:
  - incrementar `completed_swaps` al completar intercambio
  - recalcular `total_swaps`
- Añadir expiración automática lógica de swaps (`expired`) al leer/listar.

**Criterios de aceptación:**
- Al completar swap, reputación de ambos usuarios se actualiza.
- Swaps expirados no aparecen como activos.

### 2.3 Testing automatizado

- Backend:
  - tests de endpoints clave (`auth`, `bookings`, `seats`, `matching`, `swaps`)
  - tests unitarios del `matching_engine`
- Frontend:
  - 1–2 tests E2E de flujo completo (buscar vuelo → reservar/seat → solicitar swap)
  - tests unitarios básicos de `swap.service` y componentes de swaps

**Criterios de aceptación:**
- Pipeline CI en verde sin Azure.
- Cobertura objetivo inicial: mínimo 60% en módulos backend nuevos del sprint 2/3.

### 2.4 Hardening local-first y DX

- Refinar `scripts/dev.sh` con chequeos de puertos y mensajes de error claros.
- Crear script seed reproducible para demo (`scripts/seed_demo_data.py`).
- Limpiar warnings más visibles de Angular templates.

**Criterios de aceptación:**
- `make dev` + seed deja entorno listo para demo en < 2 minutos.

### 2.5 Documentación TFM y defensa

- Actualizar documentación principal con arquitectura real actual (Flask + local-first).
- Añadir guía de demostración paso a paso:
  1. arranque
  2. flujo booking
  3. flujo swap
  4. caso de aceptación/rechazo

**Criterios de aceptación:**
- Documentación ejecutable de extremo a extremo por un tercero.

---

## 3. Backlog priorizado (Sprint 3)

## P0 (obligatorio)
- JWT backend + protección de endpoints críticos.
- Tests backend de rutas sprint 2.
- Seed demo local reproducible.
- Corrección de inconsistencias de documentación técnica.

## P1 (muy recomendado)
- Reputación automática tras swap completado.
- Manejo explícito de expiración de swaps.
- E2E frontend de flujo de intercambio.

## P2 (si hay margen)
- Filtros en lista de swaps (estado/fecha).
- Telemetría local simplificada (logs estructurados).
- Preparación de paquete de demo grabable.

---

## 4. Plan por fases (10 días hábiles)

### Fase A (D1–D2): Seguridad
- JWT emisión + verificación
- Protección de endpoints
- Tests de autorización

### Fase B (D3–D4): Dominio swaps/matching
- Reputación post-swap
- Expiración de swaps
- Ajustes de validación de preferencias

### Fase C (D5–D7): Testing y CI
- Suite backend
- Suite frontend mínima
- CI estable sin dependencias Azure

### Fase D (D8–D10): Demo y documentación
- Seed demo
- Guía de ejecución y defensa
- Informe Sprint 3 + cierre técnico

---

## 5. Entregables esperados

1. Código Sprint 3 mergeado en rama principal.
2. Tests automáticos backend/frontend en CI.
3. Scripts de demo local (`make dev` + seed).
4. Documentación técnica actualizada para memoria.
5. Informe Sprint 3 con métricas y evidencias.

---

## 6. Definición de Done (Sprint 3)

- Todos los endpoints sensibles requieren autenticación válida.
- Flujo booking + swap funciona completo en local sin intervención manual de datos.
- Pruebas automáticas en verde.
- Documentación de demo lista para tribunal (pasos, capturas, resultados esperados).
- Riesgos principales del proyecto mitigados o claramente documentados.

---

## 7. Riesgos del Sprint 3 y mitigación

- **Riesgo:** cambios de auth rompen frontend actual.  
  **Mitigación:** feature flag temporal + rollout por endpoint.

- **Riesgo:** falta de tiempo para cobertura amplia.  
  **Mitigación:** priorizar tests de rutas críticas de negocio.

- **Riesgo:** inconsistencia entre docs históricas y estado real.  
  **Mitigación:** actualizar primero README y arquitectura de referencia.

---

## 8. KPI de seguimiento Sprint 3

- % endpoints protegidos por JWT (objetivo: 100% críticos).
- Nº tests automáticos nuevos y ratio de éxito CI.
- Tiempo de arranque de demo local (objetivo: < 2 min).
- Nº incidencias funcionales en flujo booking/swap durante pruebas (objetivo: 0 bloqueantes).
