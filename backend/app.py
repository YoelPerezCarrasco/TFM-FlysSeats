"""
FlysSeats Backend API - Flask Application

API REST para gestión de vuelos y reservas usando Azure Cosmos DB y Amadeus API.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import logging

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(__file__))

# Importar módulos locales
from utils.cosmos_client import CosmosDBClient
from utils.amadeus_client import AmadeusClient
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
                    
                    # Use provided date or tomorrow as default
                    if date_param:
                        departure_date = date_param
                    else:
                        tomorrow = datetime.now() + timedelta(days=1)
                        departure_date = tomorrow.strftime('%Y-%m-%d')
                    
                    logger.info(f"Buscando vuelos reales en Amadeus: {departure_code} -> {arrival_code} el {departure_date}")
                    
                    # Search real flights from Amadeus API
                    flights_list = amadeus_client.search_flights(
                        origin=departure_code,
                        destination=arrival_code,
                        departure_date=departure_date,
                        adults=1,
                        max_results=20
                    )
                    
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
