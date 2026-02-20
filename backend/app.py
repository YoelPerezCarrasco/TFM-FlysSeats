"""
FlysSeats Backend API - Flask Application

API REST para gestión de vuelos y reservas usando Azure Cosmos DB y Amadeus API.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import sys
import logging

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(__file__))

# Importar módulos locales
from utils.cosmos_client import CosmosDBClient
from utils.amadeus_client import AmadeusClient
from utils.matching_engine import find_swap_suggestions, calculate_match_score
from config import Config

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear aplicación Flask
app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas las rutas

# Inicializar clientes
try:
    cosmos_client = CosmosDBClient()
    amadeus_client = AmadeusClient()
    logger.info("✅ Clientes inicializados correctamente")
except Exception as e:
    logger.error(f"❌ Error inicializando clientes: {str(e)}")
    cosmos_client = None
    amadeus_client = None

# ============================================
# RUTAS - HEALTH CHECK
# ============================================

@app.route('/', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'FlysSeats API',
        'version': '1.0.0',
        'cosmos_db': 'connected' if cosmos_client else 'disconnected',
        'amadeus_api': 'connected' if amadeus_client else 'disconnected'
    }), 200

# ============================================
# RUTAS - AUTHENTICATION
# ============================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Registrar nuevo usuario"""
    try:
        data = request.get_json()
        
        if not data or not all(key in data for key in ['email', 'password', 'name']):
            return jsonify({'error': 'Faltan datos requeridos'}), 400
        
        # Verificar si el usuario ya existe
        existing_user = cosmos_client.get_user_by_email(data['email'])
        if existing_user:
            return jsonify({'error': 'El usuario ya existe'}), 409
        
        # Crear usuario (TFM: password en texto plano para simplicidad)
        user_id = cosmos_client.create_user(
            email=data['email'],
            password=data['password'],  # TFM demo - en producción usar hash
            name=data['name']
        )
        
        return jsonify({
            'message': 'Usuario registrado exitosamente',
            'userId': user_id
        }), 201
        
    except Exception as e:
        logger.error(f"Error en registro: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Iniciar sesión"""
    try:
        data = request.get_json()
        
        if not data or not all(key in data for key in ['email', 'password']):
            return jsonify({'error': 'Faltan datos requeridos'}), 400
        
        # Buscar usuario y verificar password
        user = cosmos_client.get_user_by_email(data['email'])
        if not user or user.get('password') != data['password']:
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        # En producción, generar JWT token aquí
        return jsonify({
            'message': 'Login exitoso',
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name']
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error en login: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

# ============================================
# RUTAS - FLIGHTS
# ============================================

@app.route('/api/flights/search', methods=['GET'])
def search_flights():
    """Buscar vuelos"""
    try:
        # Obtener parámetros de búsqueda
        origin = request.args.get('origin')
        destination = request.args.get('destination')
        departure_date = request.args.get('departureDate')
        adults = request.args.get('adults', '1')
        
        if not all([origin, destination, departure_date]):
            return jsonify({'error': 'Faltan parámetros requeridos'}), 400
        
        # Buscar vuelos con Amadeus API
        flights = amadeus_client.search_flights(
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            adults=int(adults)
        )
        
        return jsonify({'flights': flights}), 200
        
    except Exception as e:
        logger.error(f"Error buscando vuelos: {str(e)}")
        return jsonify({'error': 'Error buscando vuelos'}), 500

@app.route('/api/flights', methods=['GET', 'POST'])
def flights():
    """Get all flights or create a new flight"""
    try:
        if request.method == 'GET':
            # Get query parameters
            flight_number = request.args.get('flight_number')
            departure_code = request.args.get('departure_code')
            arrival_code = request.args.get('arrival_code')
            date_param = request.args.get('date')
            
            # If searching by route (departure_code AND arrival_code), use Amadeus API
            if departure_code and arrival_code:
                # Verificar que amadeus_client está disponible
                if not amadeus_client:
                    logger.warning("Amadeus client no disponible, buscando en Cosmos DB")
                    search_params = {
                        'departure_code': departure_code,
                        'arrival_code': arrival_code
                    }
                    if date_param:
                        search_params['date'] = date_param
                    
                    flights_list = cosmos_client.search_flights(search_params)
                    return jsonify(flights_list), 200
                
                try:
                    from datetime import datetime, timedelta
                    import signal
                    
                    # Use provided date or tomorrow as default
                    if date_param:
                        departure_date = date_param
                    else:
                        tomorrow = datetime.now() + timedelta(days=1)
                        departure_date = tomorrow.strftime('%Y-%m-%d')
                    
                    logger.info(f"🔍 Buscando vuelos reales en Amadeus: {departure_code} -> {arrival_code} el {departure_date}")
                    
                    # Search real flights from Amadeus API (con timeout implícito en el Try-catch)
                    flights_list = amadeus_client.search_flights(
                        origin=departure_code,
                        destination=arrival_code,
                        departure_date=departure_date,
                        adults=1,
                        max_results=20
                    )
                    
                    logger.info(f"✅ Amadeus devolvió {len(flights_list)} resultados")
                    return jsonify(flights_list), 200
                    
                except Exception as amadeus_error:
                    logger.error(f"Error en búsqueda de Amadeus: {str(amadeus_error)}")
                    # Fallback: buscar en Cosmos DB
                    search_params = {
                        'departure_code': departure_code,
                        'arrival_code': arrival_code
                    }
                    if date_param:
                        search_params['date'] = date_param
                    
                    flights_list = cosmos_client.search_flights(search_params)
                    return jsonify(flights_list), 200
            
            # Otherwise, search in Cosmos DB
            search_params = {}
            
            if flight_number:
                search_params['flight_number'] = flight_number
            if departure_code:
                search_params['departure_code'] = departure_code
            if arrival_code:
                search_params['arrival_code'] = arrival_code
            if date_param:
                search_params['date'] = date_param
            
            flights_list = cosmos_client.search_flights(search_params)
            
            return jsonify(flights_list), 200
        
        elif request.method == 'POST':
            # Create new flight
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['flight_number', 'departure_code', 'arrival_code', 'departure_time', 'arrival_time']
            if not all(field in data for field in required_fields):
                return jsonify({'error': 'Missing required fields'}), 400
            
            # Create flight in Cosmos DB
            flight_id = cosmos_client.create_flight(data)
            
            return jsonify({
                'message': 'Flight created successfully',
                'flight_id': flight_id
            }), 201
            
    except Exception as e:
        logger.error(f"Error processing flights request: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/flights/<flight_id>', methods=['GET', 'PUT', 'DELETE'])
def flight_detail(flight_id):
    """Get, update or delete a specific flight"""
    try:
        if request.method == 'GET':
            # Get flight by ID
            flight = cosmos_client.get_flight_by_id(flight_id)
            
            if not flight:
                return jsonify({'error': 'Flight not found'}), 404
            
            return jsonify(flight), 200
            
        elif request.method == 'PUT':
            # Update flight
            data = request.get_json()
            success = cosmos_client.update_flight(flight_id, data)
            
            if not success:
                return jsonify({'error': 'Flight not found or could not be updated'}), 404
            
            return jsonify({'message': 'Flight updated successfully'}), 200
            
        elif request.method == 'DELETE':
            # Delete flight
            success = cosmos_client.delete_flight(flight_id)
            
            if not success:
                return jsonify({'error': 'Flight not found or could not be deleted'}), 404
            
            return jsonify({'message': 'Flight deleted successfully'}), 200
            
    except Exception as e:
        logger.error(f"Error processing flight detail request: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

# ============================================
# RUTAS - BOOKINGS
# ============================================

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    """Crear nueva reserva"""
    try:
        data = request.get_json()
        
        if not data or not all(key in data for key in ['userId', 'flight']):
            return jsonify({'error': 'Faltan datos requeridos'}), 400
        
        # Crear reserva
        booking_id = cosmos_client.create_booking(
            user_id=data['userId'],
            flight=data['flight']
        )
        
        return jsonify({
            'message': 'Reserva creada exitosamente',
            'bookingId': booking_id
        }), 201
        
    except Exception as e:
        logger.error(f"Error creando reserva: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/bookings/<user_id>', methods=['GET'])
def get_bookings(user_id):
    """Obtener reservas de un usuario"""
    try:
        bookings = cosmos_client.get_user_bookings(user_id)
        return jsonify({'bookings': bookings}), 200
        
    except Exception as e:
        logger.error(f"Error obteniendo reservas: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

# ============================================
# RUTAS - SEATS (Sprint 2)
# ============================================

@app.route('/api/flights/<flight_id>/seats', methods=['GET'])
def get_flight_seats(flight_id):
    """Obtener todos los asientos de un vuelo"""
    try:
        seats = cosmos_client.get_flight_seats(flight_id)
        return jsonify({'seats': seats}), 200
    except Exception as e:
        logger.error(f"Error obteniendo asientos: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/flights/<flight_id>/seats', methods=['POST'])
def join_flight(flight_id):
    """Unirse a un vuelo registrando un asiento con preferencias"""
    try:
        data = request.get_json()
        
        if not data or not all(key in data for key in ['user_id', 'seat_number']):
            return jsonify({'error': 'Faltan datos requeridos (user_id, seat_number)'}), 400
        
        user_id = data['user_id']
        seat_number = data['seat_number']
        
        # Check if user already has a seat on this flight
        existing = cosmos_client.get_user_seat_for_flight(user_id, flight_id)
        if existing:
            return jsonify({'error': 'Ya tienes un asiento en este vuelo'}), 409
        
        # Check if seat is already taken
        if cosmos_client.get_seat_taken(flight_id, seat_number):
            return jsonify({'error': 'Este asiento ya está ocupado'}), 409
        
        # Determine seat details from seat_number
        row = int(''.join(filter(str.isdigit, seat_number))) if any(c.isdigit() for c in seat_number) else 0
        column = ''.join(filter(str.isalpha, seat_number)).upper()
        
        # Infer seat type from column letter
        seat_type = 'MIDDLE'
        if column in ['A', 'F', 'K']:
            seat_type = 'WINDOW'
        elif column in ['C', 'D', 'G', 'H']:
            seat_type = 'AISLE'
        
        # Infer section from row
        section = 'MIDDLE'
        if row <= 10:
            section = 'FRONT'
        elif row >= 25:
            section = 'BACK'
        
        seat_data = {
            'id': f"seat_{flight_id}_{seat_number}",
            'type': 'seat',
            'flight_id': flight_id,
            'user_id': user_id,
            'seat_number': seat_number,
            'seat_details': {
                'type': seat_type,
                'section': section,
                'row': row,
                'column': column,
                'is_emergency_exit': data.get('is_emergency_exit', row in [12, 13]),
                'is_reclinable': data.get('is_reclinable', True),
                'extra_legroom': data.get('extra_legroom', row in [1, 12, 13])
            },
            'preferences': data.get('preferences'),
            'open_to_swap': data.get('open_to_swap', True),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        cosmos_client.create_seat(seat_data)
        
        return jsonify({
            'message': 'Asiento registrado exitosamente',
            'seat': seat_data
        }), 201
        
    except Exception as e:
        logger.error(f"Error registrando asiento: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/seats/<seat_id>', methods=['GET'])
def get_seat(seat_id):
    """Obtener un asiento por ID"""
    try:
        seat = cosmos_client.get_seat(seat_id)
        if not seat:
            return jsonify({'error': 'Asiento no encontrado'}), 404
        return jsonify(seat), 200
    except Exception as e:
        logger.error(f"Error obteniendo asiento: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/seats/<seat_id>/preferences', methods=['PUT'])
def update_seat_preferences(seat_id):
    """Actualizar las preferencias de intercambio de un asiento"""
    try:
        data = request.get_json()
        
        seat = cosmos_client.get_seat(seat_id)
        if not seat:
            return jsonify({'error': 'Asiento no encontrado'}), 404
        
        # Update preferences
        seat['preferences'] = data.get('preferences', seat.get('preferences'))
        seat['open_to_swap'] = data.get('open_to_swap', seat.get('open_to_swap', True))
        seat['updated_at'] = datetime.utcnow().isoformat()
        
        cosmos_client.update_seat(seat_id, seat)
        
        return jsonify({
            'message': 'Preferencias actualizadas',
            'seat': seat
        }), 200
        
    except Exception as e:
        logger.error(f"Error actualizando preferencias: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/seats/<seat_id>', methods=['DELETE'])
def delete_seat(seat_id):
    """Eliminar un asiento (dejar el vuelo)"""
    try:
        success = cosmos_client.delete_seat(seat_id)
        if not success:
            return jsonify({'error': 'Asiento no encontrado'}), 404
        return jsonify({'message': 'Asiento eliminado'}), 200
    except Exception as e:
        logger.error(f"Error eliminando asiento: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

# ============================================
# RUTAS - MATCHING (Sprint 2)
# ============================================

@app.route('/api/flights/<flight_id>/matching', methods=['GET'])
def get_swap_suggestions(flight_id):
    """Obtener sugerencias de intercambio para un usuario en un vuelo"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'Se requiere user_id'}), 400
        
        # Get user's seat on this flight
        user_seat = cosmos_client.get_user_seat_for_flight(user_id, flight_id)
        if not user_seat:
            return jsonify({'error': 'No tienes asiento en este vuelo'}), 404
        
        if not user_seat.get('preferences'):
            return jsonify({
                'error': 'Configura tus preferencias primero',
                'code': 'NO_PREFERENCES'
            }), 400
        
        # Get all seats open to swap on this flight
        all_seats = cosmos_client.get_flight_seats(flight_id)
        swappable_seats = [s for s in all_seats if s.get('open_to_swap', False)]
        
        # Build users map for reputation scoring
        user_ids = list(set(s.get('user_id') for s in swappable_seats))
        users_map = {}
        for uid in user_ids:
            user = cosmos_client.get_user(uid)
            if user:
                users_map[uid] = user
        
        # Run matching engine
        suggestions = find_swap_suggestions(
            flight_seats=swappable_seats,
            user_seat=user_seat,
            users_map=users_map,
            max_results=int(request.args.get('limit', 10))
        )
        
        return jsonify({
            'suggestions': suggestions,
            'total': len(suggestions),
            'your_seat': user_seat
        }), 200
        
    except Exception as e:
        logger.error(f"Error obteniendo sugerencias: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

# ============================================
# RUTAS - SWAP REQUESTS (Sprint 2)
# ============================================

@app.route('/api/swaps', methods=['POST'])
def create_swap_request():
    """Crear una solicitud de intercambio"""
    try:
        data = request.get_json()
        
        required = ['flight_id', 'requester_seat_id', 'partner_seat_id']
        if not data or not all(key in data for key in required):
            return jsonify({'error': 'Faltan datos requeridos'}), 400
        
        # Get both seats
        requester_seat = cosmos_client.get_seat(data['requester_seat_id'])
        partner_seat = cosmos_client.get_seat(data['partner_seat_id'])
        
        if not requester_seat or not partner_seat:
            return jsonify({'error': 'Asiento no encontrado'}), 404
        
        if not partner_seat.get('open_to_swap', False):
            return jsonify({'error': 'El asiento del compañero no está disponible para intercambio'}), 400
        
        # Calculate match score
        score = calculate_match_score(requester_seat, partner_seat)
        
        swap_id = f"swap_{data['flight_id']}_{requester_seat['seat_number']}_{partner_seat['seat_number']}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        swap_data = {
            'id': swap_id,
            'type': 'swap_request',
            'flight_id': data['flight_id'],
            'requester': {
                'user_id': requester_seat['user_id'],
                'current_seat': requester_seat['seat_number'],
                'seat_id': requester_seat['id']
            },
            'partner': {
                'user_id': partner_seat['user_id'],
                'current_seat': partner_seat['seat_number'],
                'seat_id': partner_seat['id']
            },
            'match_score': score,
            'status': 'pending',
            'created_by': data.get('created_by', requester_seat['user_id']),
            'messages_count': 0,
            'requester_confirmed': False,
            'partner_confirmed': False,
            'expires_at': (datetime.utcnow() + timedelta(hours=48)).isoformat(),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        cosmos_client.create_swap(swap_data)
        
        return jsonify({
            'message': 'Solicitud de intercambio creada',
            'swap': swap_data
        }), 201
        
    except Exception as e:
        logger.error(f"Error creando swap: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/swaps/<swap_id>', methods=['GET'])
def get_swap(swap_id):
    """Obtener una solicitud de intercambio"""
    try:
        swap = cosmos_client.get_swap(swap_id)
        if not swap:
            return jsonify({'error': 'Swap no encontrado'}), 404
        return jsonify(swap), 200
    except Exception as e:
        logger.error(f"Error obteniendo swap: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/swaps/<swap_id>/accept', methods=['POST'])
def accept_swap(swap_id):
    """Aceptar una solicitud de intercambio (confirmación de una parte)"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'Se requiere user_id'}), 400
        
        swap = cosmos_client.get_swap(swap_id)
        if not swap:
            return jsonify({'error': 'Swap no encontrado'}), 404
        
        if swap['status'] != 'pending':
            return jsonify({'error': f'El swap está en estado {swap["status"]}, no se puede aceptar'}), 400
        
        # Determine which participant is accepting
        if user_id == swap['requester']['user_id']:
            swap['requester_confirmed'] = True
        elif user_id == swap['partner']['user_id']:
            swap['partner_confirmed'] = True
        else:
            return jsonify({'error': 'No eres participante de este intercambio'}), 403
        
        # If both confirmed, complete the swap
        if swap['requester_confirmed'] and swap['partner_confirmed']:
            swap['status'] = 'completed'
            
            # Actually swap the seats
            requester_seat = cosmos_client.get_seat(swap['requester']['seat_id'])
            partner_seat = cosmos_client.get_seat(swap['partner']['seat_id'])
            
            if requester_seat and partner_seat:
                # Swap user_ids
                requester_seat['user_id'], partner_seat['user_id'] = partner_seat['user_id'], requester_seat['user_id']
                requester_seat['updated_at'] = datetime.utcnow().isoformat()
                partner_seat['updated_at'] = datetime.utcnow().isoformat()
                
                cosmos_client.update_seat(requester_seat['id'], requester_seat)
                cosmos_client.update_seat(partner_seat['id'], partner_seat)
                
                logger.info(f"✅ Swap completado: {swap_id}")
        else:
            swap['status'] = 'accepted'  # One party accepted, waiting for other
        
        swap['updated_at'] = datetime.utcnow().isoformat()
        cosmos_client.update_swap(swap_id, swap)
        
        return jsonify({
            'message': 'Swap aceptado' if swap['status'] != 'completed' else 'Intercambio completado',
            'swap': swap
        }), 200
        
    except Exception as e:
        logger.error(f"Error aceptando swap: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/swaps/<swap_id>/reject', methods=['POST'])
def reject_swap(swap_id):
    """Rechazar una solicitud de intercambio"""
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        
        swap = cosmos_client.get_swap(swap_id)
        if not swap:
            return jsonify({'error': 'Swap no encontrado'}), 404
        
        if swap['status'] not in ['pending', 'accepted']:
            return jsonify({'error': f'El swap está en estado {swap["status"]}, no se puede rechazar'}), 400
        
        swap['status'] = 'rejected'
        swap['updated_at'] = datetime.utcnow().isoformat()
        cosmos_client.update_swap(swap_id, swap)
        
        return jsonify({
            'message': 'Swap rechazado',
            'swap': swap
        }), 200
        
    except Exception as e:
        logger.error(f"Error rechazando swap: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/swaps/user/<user_id>', methods=['GET'])
def get_user_swaps(user_id):
    """Obtener todas las solicitudes de intercambio de un usuario"""
    try:
        status_filter = request.args.get('status')
        swaps = cosmos_client.get_user_swaps(user_id, status_filter)
        return jsonify({'swaps': swaps}), 200
    except Exception as e:
        logger.error(f"Error obteniendo swaps del usuario: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/flights/<flight_id>/swaps', methods=['GET'])
def get_flight_swaps(flight_id):
    """Obtener todas las solicitudes de intercambio de un vuelo"""
    try:
        swaps = cosmos_client.get_flight_swaps(flight_id)
        return jsonify({'swaps': swaps}), 200
    except Exception as e:
        logger.error(f"Error obteniendo swaps del vuelo: {str(e)}")
        return jsonify({'error': 'Error interno del servidor'}), 500

# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Error interno del servidor'}), 500

# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
