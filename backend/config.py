"""
Configuración centralizada para Azure Functions Backend
"""
import os
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential
from azure.keyvault.secrets import SecretClient

class Config:
    """Configuración de la aplicación"""
    
    # Environment
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'dev')
    
    # Azure Cosmos DB
    COSMOS_ENDPOINT = os.getenv('COSMOS_ENDPOINT')
    COSMOS_KEY = os.getenv('COSMOS_KEY')
    COSMOS_DATABASE = os.getenv('COSMOS_DATABASE', 'flyseats-db')
    
    # Azure Redis Cache
    REDIS_HOST = os.getenv('REDIS_HOST')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6380))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')
    REDIS_SSL = True
    
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
        required = [
            'COSMOS_ENDPOINT',
            'COSMOS_KEY',
            'REDIS_HOST',
            'REDIS_PASSWORD'
        ]
        
        missing = [key for key in required if not getattr(cls, key)]
        
        if missing:
            raise ValueError(f"Faltan configuraciones requeridas: {', '.join(missing)}")
        
        return True


# Validar configuración al importar (excepto en tests)
if os.getenv('ENVIRONMENT') != 'test':
    try:
        Config.validate_config()
        print("✅ Configuración validada correctamente")
    except ValueError as e:
        print(f"⚠️  Advertencia de configuración: {e}")
