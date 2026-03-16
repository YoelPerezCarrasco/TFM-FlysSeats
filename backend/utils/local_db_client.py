"""
Cliente local JSON para desarrollo sin Azure.
"""
from __future__ import annotations

from typing import Dict, List, Optional
from datetime import datetime
import json
import os
import uuid
import logging


logger = logging.getLogger(__name__)


class LocalDBClient:
    """Cliente singleton con persistencia en archivo JSON."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LocalDBClient, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        backend_dir = os.path.dirname(os.path.dirname(__file__))
        default_path = os.path.join(backend_dir, 'data', 'local_db.json')
        self.db_path = os.getenv('LOCAL_DB_PATH', default_path)
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

        if not os.path.exists(self.db_path):
            self._write_db({
                'users': [],
                'flights': [],
                'bookings': [],
                'seats': [],
                'swaps': [],
                'flights-cache': []
            })

        logger.info(f"✅ LocalDB inicializado en {self.db_path}")

    def _read_db(self) -> Dict:
        with open(self.db_path, 'r', encoding='utf-8') as file_handle:
            return json.load(file_handle)

    def _write_db(self, data: Dict):
        with open(self.db_path, 'w', encoding='utf-8') as file_handle:
            json.dump(data, file_handle, ensure_ascii=False, indent=2)

    def _get_container(self, name: str) -> List[Dict]:
        db = self._read_db()
        return db.get(name, [])

    def _save_container(self, name: str, items: List[Dict]):
        db = self._read_db()
        db[name] = items
        self._write_db(db)

    def _upsert(self, container: str, item: Dict):
        items = self._get_container(container)
        item_id = item.get('id')
        index = next((idx for idx, value in enumerate(items) if value.get('id') == item_id), -1)
        if index >= 0:
            items[index] = item
        else:
            items.append(item)
        self._save_container(container, items)

    # ==================== USERS ====================

    def get_user(self, user_id: str) -> Optional[Dict]:
        users = self._get_container('users')
        return next((user for user in users if user.get('id') == user_id), None)

    def get_user_by_email(self, email: str) -> Optional[Dict]:
        users = self._get_container('users')
        return next((user for user in users if user.get('email') == email), None)

    def create_user(self, **kwargs) -> str:
        user_id = kwargs.get('id') or f"user_{uuid.uuid4().hex[:10]}"
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
            'created_at': kwargs.get('created_at', datetime.utcnow().isoformat()),
            'updated_at': kwargs.get('updated_at', datetime.utcnow().isoformat())
        }
        self._upsert('users', user)
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
        self._upsert('flights', flight)
        return flight_id

    def get_flight_by_id(self, flight_id: str) -> Optional[Dict]:
        flights = self._get_container('flights')
        return next((flight for flight in flights if flight.get('id') == flight_id), None)

    def update_flight(self, flight_id: str, flight_data: Dict) -> bool:
        current = self.get_flight_by_id(flight_id)
        if not current:
            return False
        updated = {**current, **flight_data, 'id': flight_id, 'updated_at': datetime.utcnow().isoformat()}
        self._upsert('flights', updated)
        return True

    def delete_flight(self, flight_id: str) -> bool:
        flights = self._get_container('flights')
        remaining = [flight for flight in flights if flight.get('id') != flight_id]
        if len(remaining) == len(flights):
            return False
        self._save_container('flights', remaining)
        return True

    def search_flights(self, search_params: Dict) -> List[Dict]:
        flights = self._get_container('flights')

        def matches(flight: Dict) -> bool:
            if search_params.get('flight_number') and flight.get('flight_number') != search_params.get('flight_number'):
                return False
            if search_params.get('departure_code'):
                direct = flight.get('departure_code')
                nested = ((flight.get('departure') or {}).get('airport_code'))
                if search_params.get('departure_code') not in [direct, nested]:
                    return False
            if search_params.get('arrival_code'):
                direct = flight.get('arrival_code')
                nested = ((flight.get('arrival') or {}).get('airport_code'))
                if search_params.get('arrival_code') not in [direct, nested]:
                    return False
            if search_params.get('date'):
                direct = flight.get('date')
                nested = ((flight.get('departure') or {}).get('date'))
                if search_params.get('date') not in [direct, nested]:
                    return False
            return True

        return [flight for flight in flights if matches(flight)]

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
        self._upsert('bookings', booking)
        return booking_id

    def get_user_bookings(self, user_id: str) -> List[Dict]:
        bookings = self._get_container('bookings')
        return sorted(
            [booking for booking in bookings if booking.get('userId') == user_id],
            key=lambda value: value.get('createdAt', ''),
            reverse=True
        )

    # ==================== SEATS ====================

    def get_seat(self, seat_id: str) -> Optional[Dict]:
        seats = self._get_container('seats')
        return next((seat for seat in seats if seat.get('id') == seat_id), None)

    def create_seat(self, seat_data: Dict) -> Dict:
        self._upsert('seats', seat_data)
        return seat_data

    def update_seat(self, seat_id: str, seat_data: Dict) -> Dict:
        payload = {**seat_data, 'id': seat_id, 'updated_at': datetime.utcnow().isoformat()}
        self._upsert('seats', payload)
        return payload

    def delete_seat(self, seat_id: str) -> bool:
        seats = self._get_container('seats')
        remaining = [seat for seat in seats if seat.get('id') != seat_id]
        if len(remaining) == len(seats):
            return False
        self._save_container('seats', remaining)
        return True

    def get_flight_seats(self, flight_id: str) -> List[Dict]:
        seats = self._get_container('seats')
        return [seat for seat in seats if seat.get('flight_id') == flight_id]

    def get_user_seat_for_flight(self, user_id: str, flight_id: str) -> Optional[Dict]:
        seats = self.get_flight_seats(flight_id)
        return next((seat for seat in seats if seat.get('user_id') == user_id), None)

    def get_seat_taken(self, flight_id: str, seat_number: str) -> bool:
        seats = self.get_flight_seats(flight_id)
        return any(seat for seat in seats if seat.get('seat_number') == seat_number)

    # ==================== SWAPS ====================

    def get_swap(self, swap_id: str) -> Optional[Dict]:
        swaps = self._get_container('swaps')
        return next((swap for swap in swaps if swap.get('id') == swap_id), None)

    def create_swap(self, swap_data: Dict) -> Dict:
        self._upsert('swaps', swap_data)
        return swap_data

    def update_swap(self, swap_id: str, swap_data: Dict) -> Dict:
        payload = {**swap_data, 'id': swap_id, 'updated_at': datetime.utcnow().isoformat()}
        self._upsert('swaps', payload)
        return payload

    def get_user_swaps(self, user_id: str, status_filter: str = None) -> List[Dict]:
        swaps = self._get_container('swaps')
        filtered = [
            swap for swap in swaps
            if (swap.get('requester') or {}).get('user_id') == user_id
            or (swap.get('partner') or {}).get('user_id') == user_id
        ]

        if status_filter:
            filtered = [swap for swap in filtered if swap.get('status') == status_filter]

        return sorted(filtered, key=lambda value: value.get('created_at', ''), reverse=True)

    def get_flight_swaps(self, flight_id: str) -> List[Dict]:
        swaps = self._get_container('swaps')
        filtered = [swap for swap in swaps if swap.get('flight_id') == flight_id]
        return sorted(filtered, key=lambda value: value.get('created_at', ''), reverse=True)
