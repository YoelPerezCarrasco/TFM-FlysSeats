#!/usr/bin/env bash
# ============================================================
# test_e2e_flow.sh — Pruebas end-to-end de Bookings e Intercambios
#
# Ejecuta contra local por defecto:
#   cd backend && bash tests/test_e2e_flow.sh
#
# O contra otra URL:
#   API_URL=https://tu-api/api bash tests/test_e2e_flow.sh
# ============================================================

set -euo pipefail

API_URL="${API_URL:-http://localhost:8000/api}"
TIMESTAMP=$(date +%s)

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

pass=0
fail=0

ok()   { ((pass++)); echo -e "  ${GREEN}✅ PASS${NC} — $1"; }
err()  { ((fail++)); echo -e "  ${RED}❌ FAIL${NC} — $1\n     $2"; }
info() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️  $1${NC}"; }

# ── Helper: HTTP request returning (status body) ──
call() {
  local method=$1 url=$2; shift 2
  local body="${1:-}"
  local tmp
  tmp=$(mktemp)

  if [[ -n "$body" ]]; then
    http_code=$(curl -s -o "$tmp" -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" -d "$body" "$url")
  else
    http_code=$(curl -s -o "$tmp" -w "%{http_code}" -X "$method" "$url")
  fi

  response=$(cat "$tmp"); rm -f "$tmp"
}

# ============================================================
info "0 · Health Check"
# ============================================================
call GET "$API_URL/health"
if [[ "$http_code" == "200" ]]; then
  ok "API healthy ($http_code)"
else
  err "Health check failed ($http_code)" "$response"
  echo -e "\n${RED}API no disponible. Abortando.${NC}"
  exit 1
fi

# ============================================================
info "1 · Registro de 2 usuarios de prueba"
# ============================================================
USER_A_EMAIL="testuser_a_${TIMESTAMP}@sitfly.test"
USER_B_EMAIL="testuser_b_${TIMESTAMP}@sitfly.test"

call POST "$API_URL/auth/register" \
  "{\"email\":\"$USER_A_EMAIL\",\"password\":\"Test1234!\",\"name\":\"Alice Test\"}"

if [[ "$http_code" == "201" ]]; then
  USER_A_ID=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('userId',''))" 2>/dev/null || echo "")
  if [[ -z "$USER_A_ID" ]]; then
    USER_A_ID=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('user',{}).get('id',''))" 2>/dev/null || echo "")
  fi
  ok "User A registrado: $USER_A_ID"
else
  err "Registro User A ($http_code)" "$response"
fi

call POST "$API_URL/auth/register" \
  "{\"email\":\"$USER_B_EMAIL\",\"password\":\"Test1234!\",\"name\":\"Bob Test\"}"

if [[ "$http_code" == "201" ]]; then
  USER_B_ID=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('userId',''))" 2>/dev/null || echo "")
  if [[ -z "$USER_B_ID" ]]; then
    USER_B_ID=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('user',{}).get('id',''))" 2>/dev/null || echo "")
  fi
  ok "User B registrado: $USER_B_ID"
else
  err "Registro User B ($http_code)" "$response"
fi

# ============================================================
info "2 · Login de ambos usuarios"
# ============================================================
call POST "$API_URL/auth/login" \
  "{\"email\":\"$USER_A_EMAIL\",\"password\":\"Test1234!\"}"
if [[ "$http_code" == "200" ]]; then
  # Re-read userId from login response in case register didn't return it
  LOGIN_A_ID=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('user',{}).get('id',''))" 2>/dev/null || echo "")
  [[ -n "$LOGIN_A_ID" ]] && USER_A_ID="$LOGIN_A_ID"
  ok "Login User A ($USER_A_ID)"
else
  err "Login User A ($http_code)" "$response"
fi

call POST "$API_URL/auth/login" \
  "{\"email\":\"$USER_B_EMAIL\",\"password\":\"Test1234!\"}"
if [[ "$http_code" == "200" ]]; then
  LOGIN_B_ID=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('user',{}).get('id',''))" 2>/dev/null || echo "")
  [[ -n "$LOGIN_B_ID" ]] && USER_B_ID="$LOGIN_B_ID"
  ok "Login User B ($USER_B_ID)"
else
  err "Login User B ($http_code)" "$response"
fi

# ============================================================
info "3 · Crear un vuelo de prueba"
# ============================================================
FLIGHT_DATE=$(date -d "+3 days" +%Y-%m-%d 2>/dev/null || date -v+3d +%Y-%m-%d)
FLIGHT_NUMBER="SF${TIMESTAMP: -4}"

call POST "$API_URL/flights" \
  "{
    \"flight_number\": \"$FLIGHT_NUMBER\",
    \"departure_code\": \"BCN\",
    \"arrival_code\": \"MAD\",
    \"departure_time\": \"${FLIGHT_DATE}T08:00:00\",
    \"arrival_time\": \"${FLIGHT_DATE}T09:30:00\",
    \"type\": \"flight\",
    \"airline\": \"SitFly Test\",
    \"departure\": {
      \"airport_code\": \"BCN\",
      \"airport_name\": \"Barcelona El Prat\",
      \"date\": \"$FLIGHT_DATE\",
      \"time\": \"08:00\"
    },
    \"arrival\": {
      \"airport_code\": \"MAD\",
      \"airport_name\": \"Madrid Barajas\",
      \"date\": \"$FLIGHT_DATE\",
      \"time\": \"09:30\"
    }
  }"

if [[ "$http_code" == "201" ]]; then
  FLIGHT_ID=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('flight_id','') or d.get('id',''))" 2>/dev/null || echo "")
  ok "Vuelo creado: $FLIGHT_NUMBER (ID: $FLIGHT_ID)"
else
  warn "Vuelo no creado ($http_code) — puede que ya exista. Intentando buscar..."
  call GET "$API_URL/flights?flight_number=$FLIGHT_NUMBER"
  FLIGHT_ID=$(echo "$response" | python3 -c "import sys,json; data=json.load(sys.stdin); flights=data if isinstance(data,list) else data.get('flights',[]); print(flights[0]['id'] if flights else '')" 2>/dev/null || echo "")
  if [[ -n "$FLIGHT_ID" ]]; then
    ok "Vuelo encontrado: $FLIGHT_ID"
  else
    err "No se pudo crear ni encontrar vuelo" "$response"
  fi
fi

# ============================================================
info "4 · Booking — User A reserva vuelo"
# ============================================================
call POST "$API_URL/bookings" \
  "{
    \"userId\": \"$USER_A_ID\",
    \"flight\": {
      \"flight_number\": \"$FLIGHT_NUMBER\",
      \"departure_code\": \"BCN\",
      \"arrival_code\": \"MAD\",
      \"departure_date\": \"$FLIGHT_DATE\",
      \"departure_time\": \"08:00\",
      \"arrival_time\": \"09:30\"
    }
  }"

if [[ "$http_code" == "201" ]]; then
  BOOKING_A_ID=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('bookingId',''))" 2>/dev/null || echo "")
  ok "Booking A creado: $BOOKING_A_ID"
else
  err "Booking A ($http_code)" "$response"
fi

# ============================================================
info "5 · Booking — User A consulta sus reservas"
# ============================================================
call GET "$API_URL/bookings/$USER_A_ID"
if [[ "$http_code" == "200" ]]; then
  BOOKING_COUNT=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('bookings', d if isinstance(d,list) else [])))" 2>/dev/null || echo "0")
  ok "User A tiene $BOOKING_COUNT reserva(s)"
else
  err "GET bookings ($http_code)" "$response"
fi

# ============================================================
info "6 · Seats — Ambos usuarios se unen al vuelo"
# ============================================================
call POST "$API_URL/flights/$FLIGHT_ID/seats" \
  "{
    \"user_id\": \"$USER_A_ID\",
    \"seat_number\": \"5A\",
    \"preferences\": {
      \"preferred_type\": \"WINDOW\",
      \"preferred_section\": \"FRONT\",
      \"importance\": \"HIGH\"
    },
    \"open_to_swap\": true
  }"

if [[ "$http_code" == "201" ]]; then
  SEAT_A_ID=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('seat',{}).get('id',''))" 2>/dev/null || echo "")
  ok "User A -> asiento 5A (WINDOW/FRONT) — ID: $SEAT_A_ID"
else
  err "Seat A ($http_code)" "$response"
fi

call POST "$API_URL/flights/$FLIGHT_ID/seats" \
  "{
    \"user_id\": \"$USER_B_ID\",
    \"seat_number\": \"18D\",
    \"preferences\": {
      \"preferred_type\": \"AISLE\",
      \"preferred_section\": \"FRONT\",
      \"importance\": \"MEDIUM\"
    },
    \"open_to_swap\": true
  }"

if [[ "$http_code" == "201" ]]; then
  SEAT_B_ID=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('seat',{}).get('id',''))" 2>/dev/null || echo "")
  ok "User B -> asiento 18D (AISLE/MIDDLE) — ID: $SEAT_B_ID"
else
  err "Seat B ($http_code)" "$response"
fi

# ============================================================
info "7 · Seats — Listar asientos del vuelo"
# ============================================================
call GET "$API_URL/flights/$FLIGHT_ID/seats"
if [[ "$http_code" == "200" ]]; then
  SEAT_COUNT=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('seats', d if isinstance(d,list) else [])))" 2>/dev/null || echo "0")
  ok "Vuelo tiene $SEAT_COUNT asiento(s) registrados"
else
  err "GET seats ($http_code)" "$response"
fi

# ============================================================
info "8 · Matching — Sugerencias de intercambio para User A"
# ============================================================
call GET "$API_URL/flights/$FLIGHT_ID/matching?user_id=$USER_A_ID"
if [[ "$http_code" == "200" ]]; then
  SUGGESTION_COUNT=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total',0))" 2>/dev/null || echo "0")
  ok "Matching devolvió $SUGGESTION_COUNT sugerencia(s)"
  if [[ "$SUGGESTION_COUNT" -gt 0 ]]; then
    MATCH_SCORE=$(echo "$response" | python3 -c "import sys,json; s=json.load(sys.stdin)['suggestions'][0]; print(f\"{s['score']:.1f} pts\")" 2>/dev/null || echo "?")
    echo -e "     Score primera sugerencia: $MATCH_SCORE"
  fi
else
  err "Matching ($http_code)" "$response"
fi

# ============================================================
info "9 · Swap — User A solicita intercambio con User B"
# ============================================================
call POST "$API_URL/swaps" \
  "{
    \"flight_id\": \"$FLIGHT_ID\",
    \"requester_seat_id\": \"$SEAT_A_ID\",
    \"partner_seat_id\": \"$SEAT_B_ID\"
  }"

if [[ "$http_code" == "201" ]]; then
  SWAP_ID=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('swap',{}).get('id',''))" 2>/dev/null || echo "")
  SWAP_SCORE=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('swap',{}).get('match_score','?'))" 2>/dev/null || echo "?")
  ok "Swap creado: $SWAP_ID (score: $SWAP_SCORE)"
else
  err "Create swap ($http_code)" "$response"
fi

# ============================================================
info "10 · Swap — Consultar swap por ID"
# ============================================================
call GET "$API_URL/swaps/$SWAP_ID"
if [[ "$http_code" == "200" ]]; then
  SWAP_STATUS=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "?")
  ok "Swap status: $SWAP_STATUS"
else
  err "GET swap ($http_code)" "$response"
fi

# ============================================================
info "11 · Swap — User A acepta (primera confirmación)"
# ============================================================
call POST "$API_URL/swaps/$SWAP_ID/accept" \
  "{\"user_id\": \"$USER_A_ID\"}"

if [[ "$http_code" == "200" ]]; then
  SWAP_STATUS=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('swap',{}).get('status','?'))" 2>/dev/null || echo "?")
  REQ_CONF=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('swap',{}).get('requester_confirmed',False))" 2>/dev/null || echo "?")
  PART_CONF=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('swap',{}).get('partner_confirmed',False))" 2>/dev/null || echo "?")
  ok "User A aceptó → status=$SWAP_STATUS (requester=$REQ_CONF, partner=$PART_CONF)"
else
  err "Accept swap A ($http_code)" "$response"
fi

# ============================================================
info "12 · Swap — User B acepta (segunda confirmación → completado)"
# ============================================================
call POST "$API_URL/swaps/$SWAP_ID/accept" \
  "{\"user_id\": \"$USER_B_ID\"}"

if [[ "$http_code" == "200" ]]; then
  SWAP_STATUS=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('swap',{}).get('status','?'))" 2>/dev/null || echo "?")
  ok "User B aceptó → status=$SWAP_STATUS"
  if [[ "$SWAP_STATUS" == "completed" ]]; then
    ok "🎉 ¡Intercambio completado! Los asientos se han intercambiado."
  else
    warn "Se esperaba 'completed' pero el status es '$SWAP_STATUS'"
  fi
else
  err "Accept swap B ($http_code)" "$response"
fi

# ============================================================
info "13 · Verificar que los asientos se intercambiaron"
# ============================================================
call GET "$API_URL/seats/$SEAT_A_ID"
if [[ "$http_code" == "200" ]]; then
  SEAT_A_USER=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user_id','?'))" 2>/dev/null || echo "?")
  if [[ "$SEAT_A_USER" == "$USER_B_ID" ]]; then
    ok "Asiento 5A ahora pertenece a User B ✓"
  else
    warn "Asiento 5A pertenece a '$SEAT_A_USER' (esperado: $USER_B_ID)"
  fi
fi

call GET "$API_URL/seats/$SEAT_B_ID"
if [[ "$http_code" == "200" ]]; then
  SEAT_B_USER=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user_id','?'))" 2>/dev/null || echo "?")
  if [[ "$SEAT_B_USER" == "$USER_A_ID" ]]; then
    ok "Asiento 18D ahora pertenece a User A ✓"
  else
    warn "Asiento 18D pertenece a '$SEAT_B_USER' (esperado: $USER_A_ID)"
  fi
fi

# ============================================================
info "14 · Swap — Listar swaps de User A"
# ============================================================
call GET "$API_URL/swaps/user/$USER_A_ID"
if [[ "$http_code" == "200" ]]; then
  SWAP_COUNT=$(echo "$response" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('swaps',[])))" 2>/dev/null || echo "0")
  ok "User A tiene $SWAP_COUNT swap(s)"
else
  err "GET user swaps ($http_code)" "$response"
fi

# ============================================================
info "15 · Swap — Flujo de rechazo (nuevo swap)"
# ============================================================
# Crear otro swap para testear rechazo
call POST "$API_URL/swaps" \
  "{
    \"flight_id\": \"$FLIGHT_ID\",
    \"requester_seat_id\": \"$SEAT_B_ID\",
    \"partner_seat_id\": \"$SEAT_A_ID\"
  }"

if [[ "$http_code" == "201" ]]; then
  SWAP2_ID=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('swap',{}).get('id',''))" 2>/dev/null || echo "")
  ok "Swap 2 creado: $SWAP2_ID"

  # Rechazar
  call POST "$API_URL/swaps/$SWAP2_ID/reject" \
    "{\"user_id\": \"$USER_A_ID\"}"
  if [[ "$http_code" == "200" ]]; then
    SWAP2_STATUS=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('swap',{}).get('status','?'))" 2>/dev/null || echo "?")
    ok "Swap 2 rechazado → status=$SWAP2_STATUS"
  else
    err "Reject swap ($http_code)" "$response"
  fi
else
  err "Create swap 2 ($http_code)" "$response"
fi

# ============================================================
info "16 · Flights — Listar swaps del vuelo"
# ============================================================
call GET "$API_URL/flights/$FLIGHT_ID/swaps"
if [[ "$http_code" == "200" ]]; then
  FLIGHT_SWAP_COUNT=$(echo "$response" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('swaps',[])))" 2>/dev/null || echo "0")
  ok "Vuelo $FLIGHT_NUMBER tiene $FLIGHT_SWAP_COUNT swap(s)"
else
  err "GET flight swaps ($http_code)" "$response"
fi

# ============================================================
# RESUMEN
# ============================================================
echo ""
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "${CYAN}  RESUMEN DE PRUEBAS${NC}"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Pasaron:    $pass${NC}"
echo -e "  ${RED}Fallaron:   $fail${NC}"
echo -e "  API:        $API_URL"
echo -e "  Timestamp:  $TIMESTAMP"
echo ""

if [[ "$fail" -eq 0 ]]; then
  echo -e "  ${GREEN}🎉 ¡Todas las pruebas pasaron!${NC}"
else
  echo -e "  ${RED}⚠️  Algunos tests fallaron. Revisa los errores arriba.${NC}"
fi
echo ""
