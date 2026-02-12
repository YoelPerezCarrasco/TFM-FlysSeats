"""
Cliente de Azure Cosmos DB para gestión de datos
"""
from azure.cosmos import CosmosClient, PartitionKey, exceptions
from typing import Dict, List, Optional, Any
import logging
from config import Config

logger = logging.getLogger(__name__)


class CosmosDBClient:
    """Cliente singleton para Azure Cosmos DB"""
    
    _instance = None
    _client = None
    _database = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CosmosDBClient, cls).__new__(cls)
            cls._initialize()
        return cls._instance
    
    @classmethod
    def _initialize(cls):
        """Inicializa la conexión con Cosmos DB"""
        try:
            cls._client = CosmosClient(
                Config.COSMOS_ENDPOINT,
                credential=Config.COSMOS_KEY
            )
            cls._database = cls._client.get_database_client(Config.COSMOS_DATABASE)
            logger.info("✅ Conexión con Cosmos DB establecida")
        except Exception as e:
            logger.error(f"❌ Error conectando con Cosmos DB: {e}")
            raise
    
    def get_container(self, container_name: str):
        """Obtiene un contenedor de Cosmos DB"""
        return self._database.get_container_client(container_name)
    
    # ==================== USERS ====================
    
    def get_user(self, user_id: str) -> Optional[Dict]:
        """Obtiene un usuario por ID"""
        try:
            container = self.get_container('users')
            user = container.read_item(item=user_id, partition_key=user_id)
            return user
        except exceptions.CosmosResourceNotFoundError:
            return None
        except Exception as e:
            logger.error(f"Error obteniendo usuario {user_id}: {e}")
            return None
    
    def create_user(self, user_data: Dict) -> Dict:
        """Crea un nuevo usuario"""
        try:
            container = self.get_container('users')
            user = container.create_item(body=user_data)
            logger.info(f"Usuario creado: {user['userId']}")
            return user
        except Exception as e:
            logger.error(f"Error creando usuario: {e}")
            raise
    
    def update_user(self, user_id: str, user_data: Dict) -> Dict:
        """Actualiza un usuario"""
        try:
            container = self.get_container('users')
            user_data['userId'] = user_id
            user = container.upsert_item(body=user_data)
            logger.info(f"Usuario actualizado: {user_id}")
            return user
        except Exception as e:
            logger.error(f"Error actualizando usuario {user_id}: {e}")
            raise
    
    def get_user_by_email(self, email: str) -> Optional[Dict]:
        """Busca un usuario por email"""
        try:
            container = self.get_container('users')
            query = "SELECT * FROM c WHERE c.email = @email"
            parameters = [{"name": "@email", "value": email}]
            
            items = list(container.query_items(
                query=query,
                parameters=parameters,
                enable_cross_partition_query=True
            ))
            
            return items[0] if items else None
        except Exception as e:
            logger.error(f"Error buscando usuario por email {email}: {e}")
            return None
    
    # ==================== BOOKINGS ====================
    
    def get_booking(self, booking_id: str, user_id: str) -> Optional[Dict]:
        """Obtiene una reserva por ID"""
        try:
            container = self.get_container('bookings')
            booking = container.read_item(item=booking_id, partition_key=user_id)
            return booking
        except exceptions.CosmosResourceNotFoundError:
            return None
        except Exception as e:
            logger.error(f"Error obteniendo reserva {booking_id}: {e}")
            return None
    
    def create_booking(self, booking_data: Dict) -> Dict:
        """Crea una nueva reserva"""
        try:
            container = self.get_container('bookings')
            booking = container.create_item(body=booking_data)
            logger.info(f"Reserva creada: {booking['id']}")
            return booking
        except Exception as e:
            logger.error(f"Error creando reserva: {e}")
            raise
    
    def update_booking(self, booking_id: str, user_id: str, booking_data: Dict) -> Dict:
        """Actualiza una reserva"""
        try:
            container = self.get_container('bookings')
            booking_data['id'] = booking_id
            booking_data['userId'] = user_id
            booking = container.upsert_item(body=booking_data)
            logger.info(f"Reserva actualizada: {booking_id}")
            return booking
        except Exception as e:
            logger.error(f"Error actualizando reserva {booking_id}: {e}")
            raise
    
    def get_user_bookings(self, user_id: str) -> List[Dict]:
        """Obtiene todas las reservas de un usuario"""
        try:
            container = self.get_container('bookings')
            query = "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC"
            parameters = [{"name": "@userId", "value": user_id}]
            
            items = list(container.query_items(
                query=query,
                parameters=parameters,
                partition_key=user_id
            ))
            
            return items
        except Exception as e:
            logger.error(f"Error obteniendo reservas del usuario {user_id}: {e}")
            return []
    
    def delete_booking(self, booking_id: str, user_id: str) -> bool:
        """Elimina una reserva (soft delete)"""
        try:
            booking = self.get_booking(booking_id, user_id)
            if booking:
                booking['status'] = 'cancelled'
                self.update_booking(booking_id, user_id, booking)
                logger.info(f"Reserva cancelada: {booking_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error cancelando reserva {booking_id}: {e}")
            return False
    
    # ==================== FLIGHT CACHE ====================
    
    def get_cached_flights(self, search_key: str) -> Optional[Dict]:
        """Obtiene vuelos cacheados"""
        try:
            container = self.get_container('flights-cache')
            cached = container.read_item(item=search_key, partition_key=search_key)
            return cached
        except exceptions.CosmosResourceNotFoundError:
            return None
        except Exception as e:
            logger.error(f"Error obteniendo cache de vuelos: {e}")
            return None
    
    def cache_flights(self, search_key: str, flights_data: Dict) -> Dict:
        """Cachea resultados de búsqueda de vuelos"""
        try:
            container = self.get_container('flights-cache')
            cache_data = {
                'id': search_key,
                'searchKey': search_key,
                'data': flights_data,
                'ttl': Config.FLIGHT_SEARCH_CACHE_TTL
            }
            cached = container.upsert_item(body=cache_data)
            logger.info(f"Vuelos cacheados: {search_key}")
            return cached
        except Exception as e:
            logger.error(f"Error cacheando vuelos: {e}")
            raise


# Instancia global del cliente
cosmos_db = CosmosDBClient()
