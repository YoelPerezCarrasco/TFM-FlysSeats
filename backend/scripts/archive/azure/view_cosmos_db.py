"""
Script para visualizar el contenido de Cosmos DB
"""
import sys
import os
import json
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from azure.cosmos import CosmosClient
from config import Config

def view_cosmos_db():
    """Visualiza el contenido de la base de datos"""
    print("📊 Visualizando Cosmos DB...\n")
    
    try:
        # Conectar a Cosmos DB
        client = CosmosClient(Config.COSMOS_ENDPOINT, credential=Config.COSMOS_KEY)
        database = client.get_database_client(Config.COSMOS_DATABASE)
        
        print(f"📁 Base de datos: {Config.COSMOS_DATABASE}")
        print(f"🌐 Endpoint: {Config.COSMOS_ENDPOINT}")
        print("="*80)
        
        # Listar contenedores
        containers = ['users', 'flights', 'bookings']
        
        for container_name in containers:
            print(f"\n📦 Contenedor: {container_name}")
            print("-"*80)
            
            try:
                container = database.get_container_client(container_name)
                
                # Contar documentos
                query = "SELECT VALUE COUNT(1) FROM c"
                items = list(container.query_items(query=query, enable_cross_partition_query=True))
                count = items[0] if items else 0
                
                print(f"   📊 Total documentos: {count}")
                
                if count > 0:
                    # Obtener primeros 5 documentos
                    query = "SELECT * FROM c OFFSET 0 LIMIT 5"
                    items = list(container.query_items(
                        query=query,
                        enable_cross_partition_query=True
                    ))
                    
                    print(f"   📄 Primeros {min(count, 5)} documentos:\n")
                    for i, item in enumerate(items, 1):
                        print(f"   {i}. ID: {item.get('id', 'N/A')}")
                        # Mostrar campos relevantes según el contenedor
                        if container_name == 'users':
                            print(f"      Email: {item.get('email', 'N/A')}")
                            print(f"      Name: {item.get('name', 'N/A')}")
                        elif container_name == 'bookings':
                            print(f"      Flight ID: {item.get('flightId', 'N/A')}")
                            print(f"      Status: {item.get('status', 'N/A')}")
                            print(f"      User ID: {item.get('userId', 'N/A')}")
                        elif container_name == 'flights':
                            print(f"      Origin: {item.get('origin', 'N/A')}")
                            print(f"      Destination: {item.get('destination', 'N/A')}")
                        print()
                else:
                    print("   ⚠️  Contenedor vacío")
                    
            except Exception as e:
                print(f"   ❌ Error accediendo al contenedor: {e}")
        
        print("\n" + "="*80)
        print("✅ Visualización completada")
        
    except Exception as e:
        print(f"❌ Error conectando a Cosmos DB: {e}")
        raise

if __name__ == "__main__":
    view_cosmos_db()
