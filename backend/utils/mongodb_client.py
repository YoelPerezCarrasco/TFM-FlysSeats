"""
Cliente MongoDB para desarrollo local y contenedores.
"""
from __future__ import annotations

from typing import Dict, List, Optional
from datetime import datetime
import logging
import uuid
from copy import deepcopy

from pymongo import MongoClient, DESCENDING
from mongita import MongitaClientDisk

from config import Config


logger = logging.getLogger(__name__)


class MongoDBClient:
    """Cliente singleton para MongoDB."""

    _instance = None
    _client = None
    _database = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBClient, cls).__new__(cls)
            cls._initialize()
        return cls._instance

    @classmethod
    def _initialize(cls):
        try:
            cls._client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=3000)
            cls._client.admin.command('ping')
            cls._database = cls._client[Config.MONGO_DATABASE]

            cls._database.users.create_index('id', unique=True)
            cls._database.users.create_index('email', unique=True)
            cls._database.flights.create_index('id', unique=True)
            cls._database.bookings.create_index('id', unique=True)
            cls._database.seats.create_index('id', unique=True)
            cls._database.swaps.create_index('id', unique=True)

            logger.info(f"✅ Conexión con MongoDB establecida: {Config.MONGO_DATABASE}")
        except Exception as error:
            if Config.LOCAL_MODE and Config.MONGO_EMULATOR:
                logger.warning(f"⚠️ MongoDB no disponible ({error}). Usando emulador local Mongita.")
                cls._client = MongitaClientDisk(Config.MONGO_EMULATOR_PATH)
                cls._database = cls._client[Config.MONGO_DATABASE]
                logger.info(f"✅ Mongita inicializado: {Config.MONGO_DATABASE} ({Config.MONGO_EMULATOR_PATH})")
                return

            logger.warning(f"⚠️ MongoDB no disponible: {error}")
            raise

    def _collection(self, name: str):
        return self._database[name]

    # ==================== USERS ====================

    def get_user(self, user_id: str) -> Optional[Dict]:
        user = self._collection('users').find_one({'id': user_id}, {'_id': 0})
        return user

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        user = self._collection('users').find_one({'email': email}, {'_id': 0})
        return user

    def create_user(self, **kwargs) -> str:
        user_id = kwargs.get('id') or f"user_{uuid.uuid4().hex[:10]}"
        now = datetime.utcnow().isoformat()
        user = {
            'id': user_id,
            'type': 'user',
            'email': kwargs.get('email'),
            'password': kwargs.get('password'),
            'name': kwargs.get('name'),
            'reputation': kwargs.get('reputation', {
                'rating': 5.0,
                'total_swaps': 0,
                'completed_swaps': 0
            }),
            'created_at': kwargs.get('created_at', now),
            'updated_at': kwargs.get('updated_at', now)
        }
        self._collection('users').insert_one(user)
        return user_id

    # ==================== FLIGHTS ====================

    def create_flight(self, flight_data: Dict) -> str:
        flight_id = flight_data.get('id') or f"flight_{uuid.uuid4().hex[:10]}"
        now = datetime.utcnow().isoformat()
        flight = {
            'id': flight_id,
            'type': 'flight',
            **flight_data,
            'created_at': flight_data.get('created_at', now),
            'updated_at': now
        }
        self._collection('flights').insert_one(flight)
        return flight_id

    def get_flight_by_id(self, flight_id: str) -> Optional[Dict]:
        return self._collection('flights').find_one({'id': flight_id}, {'_id': 0})

    def get_flight(self, flight_id: str) -> Optional[Dict]:
        return self.get_flight_by_id(flight_id)

    def update_flight(self, flight_id: str, flight_data: Dict) -> bool:
        current = self.get_flight_by_id(flight_id)
        if not current:
            return False
        updated = {**current, **flight_data, 'id': flight_id, 'updated_at': datetime.utcnow().isoformat()}
        self._collection('flights').replace_one({'id': flight_id}, updated, upsert=False)
        return True

    def delete_flight(self, flight_id: str) -> bool:
        result = self._collection('flights').delete_one({'id': flight_id})
        return result.deleted_count > 0

    def search_flights(self, search_params: Dict) -> List[Dict]:
        query = {}
        if search_params.get('flight_number'):
            query['flight_number'] = search_params['flight_number']
        if search_params.get('departure_code'):
            query['$and'] = query.get('$and', [])
            query['$and'].append({'$or': [
                {'departure_code': search_params['departure_code']},
                {'departure.airport_code': search_params['departure_code']}
            ]})
        if search_params.get('arrival_code'):
            query['$and'] = query.get('$and', [])
            query['$and'].append({'$or': [
                {'arrival_code': search_params['arrival_code']},
                {'arrival.airport_code': search_params['arrival_code']}
            ]})
        if search_params.get('date'):
            query['$and'] = query.get('$and', [])
            query['$and'].append({'$or': [
                {'date': search_params['date']},
                {'departure.date': search_params['date']}
            ]})

        return list(self._collection('flights').find(query, {'_id': 0}))

    # ==================== BOOKINGS ====================

    def create_booking(self, user_id: str, flight: Dict) -> str:
        booking_id = f"booking_{uuid.uuid4().hex[:10]}"
        now = datetime.utcnow().isoformat()
        booking = {
            'id': booking_id,
            'type': 'booking',
            'userId': user_id,
            'flight': flight,
            'status': 'confirmed',
            'createdAt': now,
            'updatedAt': now
        }
        self._collection('bookings').insert_one(deepcopy(booking))
        return booking_id

    def get_user_bookings(self, user_id: str) -> List[Dict]:
        return list(self._collection('bookings').find({'userId': user_id}, {'_id': 0}).sort('createdAt', DESCENDING))

    # ==================== SEATS ====================

    def get_seat(self, seat_id: str) -> Optional[Dict]:
        return self._collection('seats').find_one({'id': seat_id}, {'_id': 0})

    def create_seat(self, seat_data: Dict) -> Dict:
        self._collection('seats').insert_one(deepcopy(seat_data))
        return seat_data

    def update_seat(self, seat_id: str, seat_data: Dict) -> Dict:
        payload = {**seat_data, 'id': seat_id, 'updated_at': datetime.utcnow().isoformat()}
        self._collection('seats').replace_one({'id': seat_id}, payload, upsert=True)
        return payload

    def delete_seat(self, seat_id: str) -> bool:
        result = self._collection('seats').delete_one({'id': seat_id})
        return result.deleted_count > 0

    def get_flight_seats(self, flight_id: str) -> List[Dict]:
        return list(self._collection('seats').find({'flight_id': flight_id}, {'_id': 0}))

    def get_user_seat_for_flight(self, user_id: str, flight_id: str) -> Optional[Dict]:
        return self._collection('seats').find_one({'user_id': user_id, 'flight_id': flight_id}, {'_id': 0})

    def get_seat_taken(self, flight_id: str, seat_number: str) -> bool:
        return self._collection('seats').count_documents({'flight_id': flight_id, 'seat_number': seat_number}, limit=1) > 0

    # ==================== SWAPS ====================

    def get_swap(self, swap_id: str) -> Optional[Dict]:
        return self._collection('swaps').find_one({'id': swap_id}, {'_id': 0})

    def create_swap(self, swap_data: Dict) -> Dict:
        self._collection('swaps').insert_one(deepcopy(swap_data))
        return swap_data

    def update_swap(self, swap_id: str, swap_data: Dict) -> Dict:
        payload = {**swap_data, 'id': swap_id, 'updated_at': datetime.utcnow().isoformat()}
        self._collection('swaps').replace_one({'id': swap_id}, payload, upsert=True)
        return payload

    def get_user_swaps(self, user_id: str, status_filter: str = None) -> List[Dict]:
        query = {
            '$or': [
                {'requester.user_id': user_id},
                {'partner.user_id': user_id}
            ]
        }
        if status_filter:
            query['status'] = status_filter
        return list(self._collection('swaps').find(query, {'_id': 0}).sort('created_at', DESCENDING))

    def get_flight_swaps(self, flight_id: str) -> List[Dict]:
        return list(self._collection('swaps').find({'flight_id': flight_id}, {'_id': 0}).sort('created_at', DESCENDING))
