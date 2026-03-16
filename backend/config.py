"""
Configuración centralizada del backend.
"""
import os

from azure.identity import ManagedIdentityCredential
from azure.keyvault.secrets import SecretClient

class Config:
    """Configuración de la aplicación"""
    
    # Environment
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'dev')
    LOCAL_MODE = os.getenv('LOCAL_MODE', '').lower() == 'true' or (
        ENVIRONMENT != 'prod' and not os.getenv('COSMOS_ENDPOINT')
    )
    DB_MODE = os.getenv('DB_MODE', 'mongodb' if LOCAL_MODE else 'azure-cosmos')
    
    # Azure Cosmos DB
    COSMOS_ENDPOINT = os.getenv('COSMOS_ENDPOINT')
    COSMOS_KEY = os.getenv('COSMOS_KEY')
    COSMOS_DATABASE = os.getenv('COSMOS_DATABASE', 'flyseats-db')

    # MongoDB local / contenedores
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
    MONGO_DATABASE = os.getenv('MONGO_DATABASE', 'sitfly')
    MONGO_EMULATOR = os.getenv('MONGO_EMULATOR', 'true' if LOCAL_MODE else 'false').lower() == 'true'
    MONGO_EMULATOR_PATH = os.getenv('MONGO_EMULATOR_PATH', './data/mongita')
    
    # Azure Redis Cache
    REDIS_HOST = os.getenv('REDIS_HOST')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6379 if LOCAL_MODE else 6380))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')
    REDIS_SSL = os.getenv('REDIS_SSL', 'false' if LOCAL_MODE else 'true').lower() == 'true'
    
    # Azure Storage
    STORAGE_CONNECTION_STRING = os.getenv('STORAGE_CONNECTION_STRING')
    TICKETS_CONTAINER = 'tickets'
    DOCUMENTS_CONTAINER = 'documents'
    
    # Azure Key Vault
    KEY_VAULT_URL = os.getenv('KEY_VAULT_URL')
    
    # Application Insights
    APPINSIGHTS_INSTRUMENTATION_KEY = os.getenv('APPINSIGHTS_INSTRUMENTATIONKEY')
    
    # JWT Configuration
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION_HOURS = 24
    
    # Amadeus API (se obtienen de Key Vault)
    AMADEUS_API_KEY = os.getenv('AMADEUS_API_KEY')
    AMADEUS_API_SECRET = os.getenv('AMADEUS_API_SECRET')
    AMADEUS_ENVIRONMENT = 'production' if ENVIRONMENT == 'prod' else 'test'
    
    # Cache TTL (segundos)
    FLIGHT_SEARCH_CACHE_TTL = 3600  # 1 hora
    USER_SESSION_CACHE_TTL = 86400   # 24 horas
    
    @classmethod
    def get_secret_from_keyvault(cls, secret_name: str) -> str:
        """
        Obtiene un secreto de Azure Key Vault
        
        Args:
            secret_name: Nombre del secreto
            
        Returns:
            Valor del secreto
        """
        if cls.LOCAL_MODE or not cls.KEY_VAULT_URL:
            return os.getenv(secret_name.upper().replace('-', '_'))

        try:
            # En Azure, usa Managed Identity
            credential = ManagedIdentityCredential()
            client = SecretClient(vault_url=cls.KEY_VAULT_URL, credential=credential)
            secret = client.get_secret(secret_name)
            return secret.value
        except Exception as e:
            # En desarrollo local, usa las variables de entorno
            print(f"No se pudo obtener el secreto de Key Vault: {e}")
            return os.getenv(secret_name.upper().replace('-', '_'))
    
    @classmethod
    def validate_config(cls):
        """Valida que todas las configuraciones necesarias estén presentes"""
        if cls.LOCAL_MODE:
            print("ℹ️  Modo local activo: Azure Cosmos DB no requerido")
            return True

        # Redis es opcional (para TFM puede estar deshabilitado)
        redis_enabled = os.getenv('REDIS_ENABLED', 'false').lower() == 'true'
        
        required = [
            'COSMOS_ENDPOINT',
            'COSMOS_KEY'
        ]
        
        # Solo validar Redis si está habilitado
        if redis_enabled:
            required.extend(['REDIS_HOST', 'REDIS_PASSWORD'])
        
        missing = [key for key in required if not getattr(cls, key)]
        
        if missing:
            raise ValueError(f"Faltan configuraciones requeridas: {', '.join(missing)}")
        
        if not redis_enabled:
            print("ℹ️  Modo TFM: Redis deshabilitado (ahorro de costos)")
        
        return True


# Validar configuración al importar (excepto en tests)
if os.getenv('ENVIRONMENT') != 'test':
    try:
        Config.validate_config()
        print("✅ Configuración validada correctamente")
    except ValueError as e:
        print(f"⚠️  Advertencia de configuración: {e}")
