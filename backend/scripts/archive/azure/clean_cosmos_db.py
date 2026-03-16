"""
Script para limpiar datos de prueba en Cosmos DB
"""
import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from azure.cosmos import CosmosClient
from config import Config

def clean_test_data():
    """Limpia los datos de prueba de la base de datos"""
    print("🧹 Limpiando datos de prueba...\n")
    
    try:
        # Conectar a Cosmos DB
        client = CosmosClient(Config.COSMOS_ENDPOINT, credential=Config.COSMOS_KEY)
        database = client.get_database_client(Config.COSMOS_DATABASE)
        
        containers = ['users', 'flights', 'bookings']
        
        for container_name in containers:
            try:
                container = database.get_container_client(container_name)
                
                # Obtener todos los documentos
                query = "SELECT c.id, c.userId FROM c" if container_name in ['users', 'bookings'] else "SELECT c.id, c.flightId FROM c"
                items = list(container.query_items(
                    query=query,
                    enable_cross_partition_query=True
                ))
                
                # Eliminar cada documento
                for item in items:
                    partition_key = item.get('userId') or item.get('flightId')
                    container.delete_item(item=item['id'], partition_key=partition_key)
                    print(f"   🗑️  Eliminado: {item['id'][:20]}...")
                
                print(f"✅ Contenedor '{container_name}' limpiado ({len(items)} documentos eliminados)\n")
                
            except Exception as e:
                print(f"⚠️  Error en contenedor '{container_name}': {e}\n")
        
        print("="*80)
        print("🎉 Base de datos limpiada correctamente!")
        
    except Exception as e:
        print(f"❌ Error limpiando base de datos: {e}")
        raise

if __name__ == "__main__":
    clean_test_data()
