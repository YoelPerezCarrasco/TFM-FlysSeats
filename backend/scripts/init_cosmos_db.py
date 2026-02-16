"""
Script para inicializar la estructura de Cosmos DB
Crea los contenedores necesarios si no existen
"""
import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from azure.cosmos import CosmosClient, PartitionKey, exceptions
from config import Config

def init_cosmos_db():
    """Inicializa la base de datos y contenedores de Cosmos DB"""
    print("🚀 Inicializando Cosmos DB...")
    
    try:
        # Conectar a Cosmos DB
        client = CosmosClient(Config.COSMOS_ENDPOINT, credential=Config.COSMOS_KEY)
        print(f"✅ Conectado a Cosmos DB: {Config.COSMOS_ENDPOINT}")
        
        # Obtener/crear base de datos
        try:
            database = client.create_database(id=Config.COSMOS_DATABASE)
            print(f"✅ Base de datos creada: {Config.COSMOS_DATABASE}")
        except exceptions.CosmosResourceExistsError:
            database = client.get_database_client(Config.COSMOS_DATABASE)
            print(f"ℹ️  Base de datos ya existe: {Config.COSMOS_DATABASE}")
        
        # Definir contenedores
        containers = [
            {
                'id': 'users',
                'partition_key': PartitionKey(path="/userId"),
                'description': 'Usuarios del sistema'
            },
            {
                'id': 'flights',
                'partition_key': PartitionKey(path="/flightId"),
                'description': 'Información de vuelos'
            },
            {
                'id': 'bookings',
                'partition_key': PartitionKey(path="/userId"),
                'description': 'Reservas de usuarios'
            }
        ]
        
        # Crear contenedores
        for container_config in containers:
            try:
                container = database.create_container(
                    id=container_config['id'],
                    partition_key=container_config['partition_key']
                )
                print(f"✅ Contenedor creado: {container_config['id']} - {container_config['description']}")
            except exceptions.CosmosResourceExistsError:
                print(f"ℹ️  Contenedor ya existe: {container_config['id']}")
        
        print("\n🎉 ¡Cosmos DB inicializado correctamente!")
        print("\n📊 Estructura de la base de datos:")
        print(f"   Database: {Config.COSMOS_DATABASE}")
        for container_config in containers:
            print(f"   - {container_config['id']}: {container_config['description']}")
        
    except Exception as e:
        print(f"❌ Error inicializando Cosmos DB: {e}")
        raise

if __name__ == "__main__":
    init_cosmos_db()
