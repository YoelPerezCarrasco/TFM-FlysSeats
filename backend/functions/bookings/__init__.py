import azure.functions as func
import json
import logging
import sys
import os
from datetime import datetime
import uuid

# Añadir el directorio raíz al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.cosmos_client import cosmos_db
from utils.redis_client import redis_client

logger = logging.getLogger(__name__)


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Azure Function para gestión de reservas (bookings)
    
    Endpoints:
    - GET /api/bookings?userId=xxx - Listar reservas del usuario
    - POST /api/bookings - Crear nueva reserva
    - PUT /api/bookings/{id} - Actualizar reserva
    - DELETE /api/bookings/{id} - Cancelar reserva
    """
    logger.info(f'📋 Procesando request de bookings: {req.method}')
    
    try:
        # Obtener userId del query param o del body
        user_id = req.params.get('userId')
        
        if req.method == 'GET':
            return handle_get_bookings(user_id)
        elif req.method == 'POST':
            return handle_create_booking(req)
        elif req.method == 'PUT':
            return handle_update_booking(req)
        elif req.method == 'DELETE':
            booking_id = req.route_params.get('id')
            return handle_cancel_booking(booking_id, user_id)
        else:
            return func.HttpResponse(
                json.dumps({"error": "Method not allowed"}),
                mimetype="application/json",
                status_code=405
            )
            
    except Exception as e:
        logger.error(f'❌ Error procesando bookings: {e}')
        return func.HttpResponse(
            json.dumps({
                "error": "Internal server error",
                "message": str(e)
            }),
            mimetype="application/json",
            status_code=500
        )


def handle_get_bookings(user_id: str) -> func.HttpResponse:
    """Obtiene todas las reservas de un usuario"""
    if not user_id:
        return func.HttpResponse(
            json.dumps({"error": "userId is required"}),
            mimetype="application/json",
            status_code=400
        )
    
    try:
        # Intentar obtener del cache primero
        cache_key = f"bookings:user:{user_id}"
        cached_bookings = redis_client.get(cache_key)
        
        if cached_bookings:
            logger.info(f'✅ Bookings obtenidas del cache para user {user_id}')
            return func.HttpResponse(
                json.dumps({
                    "success": True,
                    "count": len(cached_bookings),
                    "data": cached_bookings,
                    "source": "cache"
                }),
                mimetype="application/json",
                status_code=200
            )
        
        # Si no está en cache, obtener de Cosmos DB
        bookings = cosmos_db.get_user_bookings(user_id)
        
        # Cachear los resultados
        redis_client.set(cache_key, bookings, ttl=300)  # 5 minutos
        
        logger.info(f'✅ Encontradas {len(bookings)} reservas para user {user_id}')
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "count": len(bookings),
                "data": bookings,
                "source": "database"
            }),
            mimetype="application/json",
            status_code=200
        )
        
    except Exception as e:
        logger.error(f'Error obteniendo bookings: {e}')
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            mimetype="application/json",
            status_code=500
        )


def handle_create_booking(req: func.HttpRequest) -> func.HttpResponse:
    """Crea una nueva reserva"""
    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "Invalid JSON body"}),
            mimetype="application/json",
            status_code=400
        )
    
    # Validar campos requeridos
    required_fields = ['userId', 'flightOffer', 'passengers']
    missing_fields = [field for field in required_fields if field not in req_body]
    
    if missing_fields:
        return func.HttpResponse(
            json.dumps({
                "error": "Missing required fields",
                "missing": missing_fields
            }),
            mimetype="application/json",
            status_code=400
        )
    
    try:
        user_id = req_body['userId']
        flight_offer = req_body['flightOffer']
        passengers = req_body['passengers']
        
        # Crear el objeto de reserva
        booking_data = {
            'id': str(uuid.uuid4()),
            'userId': user_id,
            'bookingNumber': generate_booking_number(),
            'flightOffer': flight_offer,
            'passengers': passengers,
            'status': 'pending',
            'totalPrice': float(flight_offer.get('price', {}).get('grandTotal', 0)),
            'currency': flight_offer.get('price', {}).get('currency', 'EUR'),
            'createdAt': datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat()
        }
        
        # Guardar en Cosmos DB
        booking = cosmos_db.create_booking(booking_data)
        
        # Invalidar cache
        cache_key = f"bookings:user:{user_id}"
        redis_client.delete(cache_key)
        
        logger.info(f'✅ Reserva creada: {booking["id"]}')
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "data": booking
            }),
            mimetype="application/json",
            status_code=201
        )
        
    except Exception as e:
        logger.error(f'Error creando booking: {e}')
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            mimetype="application/json",
            status_code=500
        )


def handle_update_booking(req: func.HttpRequest) -> func.HttpResponse:
    """Actualiza una reserva existente"""
    booking_id = req.route_params.get('id')
    
    if not booking_id:
        return func.HttpResponse(
            json.dumps({"error": "Booking ID is required"}),
            mimetype="application/json",
            status_code=400
        )
    
    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "Invalid JSON body"}),
            mimetype="application/json",
            status_code=400
        )
    
    try:
        user_id = req_body.get('userId')
        
        if not user_id:
            return func.HttpResponse(
                json.dumps({"error": "userId is required"}),
                mimetype="application/json",
                status_code=400
            )
        
        # Obtener la reserva existente
        existing_booking = cosmos_db.get_booking(booking_id, user_id)
        
        if not existing_booking:
            return func.HttpResponse(
                json.dumps({"error": "Booking not found"}),
                mimetype="application/json",
                status_code=404
            )
        
        # Actualizar campos
        existing_booking.update(req_body)
        existing_booking['updatedAt'] = datetime.utcnow().isoformat()
        
        # Guardar cambios
        updated_booking = cosmos_db.update_booking(booking_id, user_id, existing_booking)
        
        # Invalidar cache
        cache_key = f"bookings:user:{user_id}"
        redis_client.delete(cache_key)
        
        logger.info(f'✅ Reserva actualizada: {booking_id}')
        
        return func.HttpResponse(
            json.dumps({
                "success": True,
                "data": updated_booking
            }),
            mimetype="application/json",
            status_code=200
        )
        
    except Exception as e:
        logger.error(f'Error actualizando booking: {e}')
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            mimetype="application/json",
            status_code=500
        )


def handle_cancel_booking(booking_id: str, user_id: str) -> func.HttpResponse:
    """Cancela una reserva"""
    if not booking_id or not user_id:
        return func.HttpResponse(
            json.dumps({"error": "bookingId and userId are required"}),
            mimetype="application/json",
            status_code=400
        )
    
    try:
        success = cosmos_db.delete_booking(booking_id, user_id)
        
        if success:
            # Invalidar cache
            cache_key = f"bookings:user:{user_id}"
            redis_client.delete(cache_key)
            
            logger.info(f'✅ Reserva cancelada: {booking_id}')
            
            return func.HttpResponse(
                json.dumps({
                    "success": True,
                    "message": "Booking cancelled successfully"
                }),
                mimetype="application/json",
                status_code=200
            )
        else:
            return func.HttpResponse(
                json.dumps({"error": "Booking not found"}),
                mimetype="application/json",
                status_code=404
            )
        
    except Exception as e:
        logger.error(f'Error cancelando booking: {e}')
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            mimetype="application/json",
            status_code=500
        )


def generate_booking_number() -> str:
    """Genera un número de reserva único"""
    now = datetime.utcnow()
    random_suffix = str(uuid.uuid4())[:8].upper()
    return f"FLY-{now.strftime('%Y%m%d')}-{random_suffix}"

