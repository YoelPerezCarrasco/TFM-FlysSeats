"""
Cliente de Amadeus API para búsqueda real de vuelos
"""
from amadeus import Client, ResponseError
from typing import Dict, List, Optional
import logging
from datetime import datetime
from config import Config
from utils.redis_client import redis_client

logger = logging.getLogger(__name__)


class AmadeusClient:
    """Cliente para Amadeus API"""
    
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AmadeusClient, cls).__new__(cls)
            cls._initialize()
        return cls._instance
    
    @classmethod
    def _initialize(cls):
        """Inicializa el cliente de Amadeus"""
        try:
            # Obtener credenciales de Key Vault o variables de entorno
            api_key = Config.AMADEUS_API_KEY or Config.get_secret_from_keyvault('amadeus-api-key')
            api_secret = Config.AMADEUS_API_SECRET or Config.get_secret_from_keyvault('amadeus-api-secret')
            
            if not api_key or not api_secret:
                logger.warning("⚠️  Credenciales de Amadeus no configuradas. Usando modo mock.")
                cls._client = None
                return
            
            cls._client = Client(
                client_id=api_key,
                client_secret=api_secret,
                hostname='production' if Config.AMADEUS_ENVIRONMENT == 'production' else 'test'
            )
            logger.info("✅ Cliente de Amadeus inicializado")
        except Exception as e:
            logger.error(f"❌ Error inicializando cliente de Amadeus: {e}")
            cls._client = None
    
    def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        adults: int = 1,
        max_results: int = 50
    ) -> List[Dict]:
        """
        Busca vuelos usando Amadeus API
        
        Args:
            origin: Código IATA del aeropuerto de origen
            destination: Código IATA del aeropuerto de destino
            departure_date: Fecha de salida (YYYY-MM-DD)
            return_date: Fecha de regreso (opcional, YYYY-MM-DD)
            adults: Número de adultos
            max_results: Máximo de resultados
            
        Returns:
            Lista de ofertas de vuelos
        """
        # Verificar cache primero
        search_params = {
            'origin': origin,
            'destination': destination,
            'departureDate': departure_date,
            'returnDate': return_date,
            'adults': adults
        }
        
        cached_results = redis_client.get_cached_flight_search(search_params)
        if cached_results:
            logger.info(f"Cache hit para búsqueda de vuelos: {origin}-{destination}")
            return cached_results
        
        # Si no hay cliente de Amadeus, usar datos mock
        if not self._client:
            return self._get_mock_flights(origin, destination, departure_date, return_date, adults)
        
        try:
            # Búsqueda real en Amadeus
            search_kwargs = {
                'originLocationCode': origin,
                'destinationLocationCode': destination,
                'departureDate': departure_date,
                'adults': adults,
                'max': max_results,
                'currencyCode': 'EUR'
            }
            
            if return_date:
                search_kwargs['returnDate'] = return_date
            
            response = self._client.shopping.flight_offers_search.get(**search_kwargs)
            
            flights = response.data
            
            # Cachear resultados
            redis_client.cache_flight_search(search_params, flights)
            
            logger.info(f"Búsqueda exitosa: {len(flights)} vuelos encontrados")
            return flights
            
        except ResponseError as error:
            logger.error(f"Error en búsqueda de Amadeus: {error}")
            # En caso de error, devolver datos mock
            return self._get_mock_flights(origin, destination, departure_date, return_date, adults)
    
    def _get_mock_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str],
        adults: int
    ) -> List[Dict]:
        """Genera datos mock de vuelos para desarrollo/testing"""
        logger.info(f"Generando vuelos mock: {origin}-{destination}")
        
        mock_flights = [
            {
                'id': 'MOCK001',
                'type': 'flight-offer',
                'source': 'GDS',
                'instantTicketingRequired': False,
                'nonHomogeneous': False,
                'oneWay': return_date is None,
                'lastTicketingDate': '2026-02-20',
                'numberOfBookableSeats': 9,
                'itineraries': [
                    {
                        'duration': 'PT2H30M',
                        'segments': [
                            {
                                'departure': {
                                    'iataCode': origin,
                                    'terminal': '1',
                                    'at': f'{departure_date}T08:00:00'
                                },
                                'arrival': {
                                    'iataCode': destination,
                                    'terminal': '2',
                                    'at': f'{departure_date}T10:30:00'
                                },
                                'carrierCode': 'IB',
                                'number': '2345',
                                'aircraft': {
                                    'code': '320'
                                },
                                'operating': {
                                    'carrierCode': 'IB'
                                },
                                'duration': 'PT2H30M',
                                'id': '1',
                                'numberOfStops': 0,
                                'blacklistedInEU': False
                            }
                        ]
                    }
                ],
                'price': {
                    'currency': 'EUR',
                    'total': '156.78',
                    'base': '130.00',
                    'fees': [
                        {
                            'amount': '0.00',
                            'type': 'SUPPLIER'
                        },
                        {
                            'amount': '0.00',
                            'type': 'TICKETING'
                        }
                    ],
                    'grandTotal': '156.78'
                },
                'pricingOptions': {
                    'fareType': [
                        'PUBLISHED'
                    ],
                    'includedCheckedBagsOnly': True
                },
                'validatingAirlineCodes': [
                    'IB'
                ],
                'travelerPricings': [
                    {
                        'travelerId': '1',
                        'fareOption': 'STANDARD',
                        'travelerType': 'ADULT',
                        'price': {
                            'currency': 'EUR',
                            'total': '156.78',
                            'base': '130.00'
                        },
                        'fareDetailsBySegment': [
                            {
                                'segmentId': '1',
                                'cabin': 'ECONOMY',
                                'fareBasis': 'OYYRTOW',
                                'class': 'O',
                                'includedCheckedBags': {
                                    'weight': 23,
                                    'weightUnit': 'KG'
                                }
                            }
                        ]
                    }
                ]
            },
            {
                'id': 'MOCK002',
                'type': 'flight-offer',
                'source': 'GDS',
                'instantTicketingRequired': False,
                'nonHomogeneous': False,
                'oneWay': return_date is None,
                'lastTicketingDate': '2026-02-20',
                'numberOfBookableSeats': 5,
                'itineraries': [
                    {
                        'duration': 'PT3H15M',
                        'segments': [
                            {
                                'departure': {
                                    'iataCode': origin,
                                    'terminal': '1',
                                    'at': f'{departure_date}T14:30:00'
                                },
                                'arrival': {
                                    'iataCode': destination,
                                    'terminal': '2',
                                    'at': f'{departure_date}T17:45:00'
                                },
                                'carrierCode': 'VY',
                                'number': '1234',
                                'aircraft': {
                                    'code': '321'
                                },
                                'operating': {
                                    'carrierCode': 'VY'
                                },
                                'duration': 'PT3H15M',
                                'id': '2',
                                'numberOfStops': 0,
                                'blacklistedInEU': False
                            }
                        ]
                    }
                ],
                'price': {
                    'currency': 'EUR',
                    'total': '89.99',
                    'base': '75.00',
                    'fees': [
                        {
                            'amount': '0.00',
                            'type': 'SUPPLIER'
                        },
                        {
                            'amount': '0.00',
                            'type': 'TICKETING'
                        }
                    ],
                    'grandTotal': '89.99'
                },
                'pricingOptions': {
                    'fareType': [
                        'PUBLISHED'
                    ],
                    'includedCheckedBagsOnly': False
                },
                'validatingAirlineCodes': [
                    'VY'
                ],
                'travelerPricings': [
                    {
                        'travelerId': '1',
                        'fareOption': 'STANDARD',
                        'travelerType': 'ADULT',
                        'price': {
                            'currency': 'EUR',
                            'total': '89.99',
                            'base': '75.00'
                        },
                        'fareDetailsBySegment': [
                            {
                                'segmentId': '2',
                                'cabin': 'ECONOMY',
                                'fareBasis': 'LOWCOST',
                                'class': 'L',
                                'includedCheckedBags': {
                                    'quantity': 0
                                }
                            }
                        ]
                    }
                ]
            }
        ]
        
        # Si hay vuelo de vuelta, añadir itinerario
        if return_date:
            for flight in mock_flights:
                flight['itineraries'].append({
                    'duration': 'PT2H45M',
                    'segments': [
                        {
                            'departure': {
                                'iataCode': destination,
                                'terminal': '2',
                                'at': f'{return_date}T18:00:00'
                            },
                            'arrival': {
                                'iataCode': origin,
                                'terminal': '1',
                                'at': f'{return_date}T20:45:00'
                            },
                            'carrierCode': flight['validatingAirlineCodes'][0],
                            'number': '5678',
                            'aircraft': {
                                'code': '320'
                            },
                            'operating': {
                                'carrierCode': flight['validatingAirlineCodes'][0]
                            },
                            'duration': 'PT2H45M',
                            'id': '3',
                            'numberOfStops': 0,
                            'blacklistedInEU': False
                        }
                    ]
                })
        
        return mock_flights
    
    def get_flight_price(self, flight_offer: Dict) -> Dict:
        """Confirma el precio de un vuelo específico"""
        if not self._client:
            logger.info("Usando precio mock")
            return flight_offer
        
        try:
            response = self._client.shopping.flight_offers.pricing.post(flight_offer)
            return response.data
        except ResponseError as error:
            logger.error(f"Error obteniendo precio: {error}")
            return flight_offer


# Instancia global del cliente
amadeus_client = AmadeusClient()
