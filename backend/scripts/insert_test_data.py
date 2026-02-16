"""
Script para insertar datos de prueba en Cosmos DB
"""
import sys
import os
import uuid
from datetime import datetime, timedelta

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from azure.cosmos import CosmosClient
from config import Config

def insert_test_data():
    """Inserta datos de prueba en la base de datos"""
    print("🔧 Insertando datos de prueba...\n")
    
    try:
        # Conectar a Cosmos DB
        client = CosmosClient(Config.COSMOS_ENDPOINT, credential=Config.COSMOS_KEY)
        database = client.get_database_client(Config.COSMOS_DATABASE)
        
        # Usuario de prueba
        users_container = database.get_container_client('users')
        test_user_id = str(uuid.uuid4())
        
        test_user = {
            'id': test_user_id,
            'userId': test_user_id,
            'email': 'test@flyseats.com',
            'name': 'Usuario de Prueba',
            'password': 'test123',  # TFM demo - password en texto plano
            'createdAt': datetime.utcnow().isoformat(),
            'role': 'user'
        }
        
        try:
            users_container.create_item(body=test_user)
            print(f"✅ Usuario de prueba creado:")
            print(f"   Email: test@flyseats.com")
            print(f"   Password: test123")
            print(f"   User ID: {test_user_id}\n")
        except Exception as e:
            print(f"⚠️  Usuario ya existe o error: {e}\n")
        
        # Vuelo de prueba
        flights_container = database.get_container_client('flights')
        test_flight_id = str(uuid.uuid4())
        
        test_flight = {
            'id': test_flight_id,
            'flightId': test_flight_id,
            'flightNumber': 'IB8501',
            'airline': 'Iberia',
            'origin': 'MAD',
            'destination': 'BCN',
            'departureTime': (datetime.utcnow() + timedelta(days=7)).isoformat(),
            'arrivalTime': (datetime.utcnow() + timedelta(days=7, hours=1, minutes=30)).isoformat(),
            'price': 89.99,
            'currency': 'EUR',
            'availableSeats': 150,
            'aircraft': 'Airbus A320',
            'createdAt': datetime.utcnow().isoformat()
        }
        
        try:
            flights_container.create_item(body=test_flight)
            print(f"✅ Vuelo de prueba creado:")
            print(f"   {test_flight['flightNumber']}: {test_flight['origin']} → {test_flight['destination']}")
            print(f"   Precio: {test_flight['price']} {test_flight['currency']}")
            print(f"   Flight ID: {test_flight_id}\n")
        except Exception as e:
            print(f"⚠️  Vuelo ya existe o error: {e}\n")
        
        # Reserva de prueba
        bookings_container = database.get_container_client('bookings')
        test_booking_id = str(uuid.uuid4())
        
        test_booking = {
            'id': test_booking_id,
            'bookingId': test_booking_id,
            'userId': test_user_id,
            'flightId': test_flight_id,
            'passengerName': 'Usuario de Prueba',
            'passengerEmail': 'test@flyseats.com',
            'seatNumber': '12A',
            'status': 'confirmed',
            'totalPrice': 89.99,
            'currency': 'EUR',
            'bookingDate': datetime.utcnow().isoformat(),
            'createdAt': datetime.utcnow().isoformat()
        }
        
        try:
            bookings_container.create_item(body=test_booking)
            print(f"✅ Reserva de prueba creada:")
            print(f"   Booking ID: {test_booking_id}")
            print(f"   Asiento: {test_booking['seatNumber']}")
            print(f"   Estado: {test_booking['status']}\n")
        except Exception as e:
            print(f"⚠️  Reserva ya existe o error: {e}\n")
        
        print("="*80)
        print("🎉 Datos de prueba insertados correctamente!")
        print("\n📝 Credenciales de prueba:")
        print("   Email: test@flyseats.com")
        print("   Password: test123")
        
    except Exception as e:
        print(f"❌ Error insertando datos: {e}")
        raise

if __name__ == "__main__":
    insert_test_data()
