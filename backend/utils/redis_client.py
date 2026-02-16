"""
Cliente de Redis para caching de alto rendimiento
"""
import redis
import json
import logging
import os
from typing import Any, Optional
from config import Config

logger = logging.getLogger(__name__)


class RedisClient:
    """Cliente singleton para Redis Cache"""
    
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
            cls._initialize()
        return cls._instance
    
    @classmethod
    def _initialize(cls):
        """Inicializa la conexión con Redis"""
        # Verificar si Redis está habilitado
        redis_enabled = os.getenv('REDIS_ENABLED', 'false').lower() == 'true'
        
        if not redis_enabled or not Config.REDIS_HOST:
            logger.info("ℹ️  Redis deshabilitado - usando solo Cosmos DB cache (modo TFM)")
            cls._client = None
            return
        
        try:
            cls._client = redis.Redis(
                host=Config.REDIS_HOST,
                port=Config.REDIS_PORT,
                password=Config.REDIS_PASSWORD,
                ssl=Config.REDIS_SSL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            cls._client.ping()
            logger.info("✅ Conexión con Redis establecida")
        except Exception as e:
            logger.warning(f"⚠️  Redis no disponible: {e} - usando Cosmos DB cache")
            # No lanzar excepción, la app puede funcionar sin cache
            cls._client = None
    
    def get(self, key: str) -> Optional[Any]:
        """Obtiene un valor del cache"""
        if not self._client:
            return None
        
        try:
            value = self._client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error obteniendo de Redis key={key}: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Guarda un valor en el cache"""
        if not self._client:
            return False
        
        try:
            serialized = json.dumps(value)
            if ttl:
                self._client.setex(key, ttl, serialized)
            else:
                self._client.set(key, serialized)
            return True
        except Exception as e:
            logger.error(f"Error guardando en Redis key={key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Elimina un valor del cache"""
        if not self._client:
            return False
        
        try:
            self._client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Error eliminando de Redis key={key}: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Verifica si existe una key"""
        if not self._client:
            return False
        
        try:
            return self._client.exists(key) > 0
        except Exception as e:
            logger.error(f"Error verificando existencia en Redis key={key}: {e}")
            return False
    
    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Incrementa un contador"""
        if not self._client:
            return None
        
        try:
            return self._client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Error incrementando en Redis key={key}: {e}")
            return None
    
    def set_session(self, session_id: str, session_data: dict):
        """Guarda una sesión de usuario"""
        return self.set(
            f"session:{session_id}",
            session_data,
            ttl=Config.USER_SESSION_CACHE_TTL
        )
    
    def get_session(self, session_id: str) -> Optional[dict]:
        """Obtiene una sesión de usuario"""
        return self.get(f"session:{session_id}")
    
    def delete_session(self, session_id: str):
        """Elimina una sesión de usuario"""
        return self.delete(f"session:{session_id}")
    
    def cache_flight_search(self, search_params: dict, results: dict):
        """Cachea resultados de búsqueda de vuelos"""
        # Crear una key única basada en los parámetros de búsqueda
        key_parts = [
            search_params.get('origin'),
            search_params.get('destination'),
            search_params.get('departureDate'),
            search_params.get('returnDate', ''),
            str(search_params.get('adults', 1))
        ]
        cache_key = f"flights:{'_'.join(key_parts)}"
        
        return self.set(
            cache_key,
            results,
            ttl=Config.FLIGHT_SEARCH_CACHE_TTL
        )
    
    def get_cached_flight_search(self, search_params: dict) -> Optional[dict]:
        """Obtiene resultados cacheados de búsqueda de vuelos"""
        key_parts = [
            search_params.get('origin'),
            search_params.get('destination'),
            search_params.get('departureDate'),
            search_params.get('returnDate', ''),
            str(search_params.get('adults', 1))
        ]
        cache_key = f"flights:{'_'.join(key_parts)}"
        
        return self.get(cache_key)


# Instancia global del cliente
redis_client = RedisClient()
