import azure.functions as func
import json
import logging
import sys
import os

# Añadir el directorio raíz al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.amadeus_client import amadeus_client
from utils.redis_client import redis_client

logger = logging.getLogger(__name__)


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Azure Function para búsqueda de vuelos usando Amadeus API real
    
    Endpoint: POST /api/flights/search
    
    Body:
    {
        "origin": "MAD",
        "destination": "BCN",
        "departureDate": "2026-03-15",
        "returnDate": "2026-03-20",  // Opcional
        "adults": 1
    }
    """
    logger.info('🔍 Procesando búsqueda de vuelos')

    try:
        # Parsear request body
        try:
            req_body = req.get_json()
        except ValueError:
            return func.HttpResponse(
                json.dumps({"error": "Invalid JSON body"}),
                mimetype="application/json",
                status_code=400
            )
        
        # Validar parámetros requeridos
        origin = req_body.get('origin')
        destination = req_body.get('destination')
        departure_date = req_body.get('departureDate')
        
        if not all([origin, destination, departure_date]):
            return func.HttpResponse(
                json.dumps({
                    "error": "Missing required fields",
                    "required": ["origin", "destination", "departureDate"]
                }),
                mimetype="application/json",
                status_code=400
            )
        
        # Parámetros opcionales
        return_date = req_body.get('returnDate')
        adults = int(req_body.get('adults', 1))
        
        logger.info(f'Buscando vuelos: {origin} -> {destination} ({departure_date})')
        
        # Buscar vuelos usando Amadeus API
        try:
            flights = amadeus_client.search_flights(
                origin=origin.upper(),
                destination=destination.upper(),
                departure_date=departure_date,
                return_date=return_date,
                adults=adults,
                max_results=50
            )
            
            logger.info(f'✅ Encontrados {len(flights)} vuelos')
            
            return func.HttpResponse(
                body=json.dumps({
                    "success": True,
                    "count": len(flights),
                    "data": flights
                }),
                mimetype="application/json",
                status_code=200
            )
            
        except Exception as api_error:
            logger.error(f'Error en búsqueda de vuelos: {api_error}')
            return func.HttpResponse(
                json.dumps({
                    "error": "Error searching flights",
                    "message": str(api_error)
                }),
                mimetype="application/json",
                status_code=500
            )
        
    except Exception as e:
        logger.error(f'Error procesando request: {e}')
        return func.HttpResponse(
            json.dumps({
                "error": "Internal server error",
                "message": str(e)
            }),
            mimetype="application/json",
            status_code=500
        )
    except Exception as e:
        logging.error(f"Error processing request: {str(e)}")
        return func.HttpResponse(
            "Internal server error",
            status_code=500
        )
