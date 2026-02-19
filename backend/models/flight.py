"""
Flight data models
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime, date, time
from enum import Enum


class FlightStatus(str, Enum):
    """Flight status enumeration"""
    UPCOMING = "upcoming"
    BOARDING = "boarding"
    DEPARTED = "departed"
    CANCELLED = "cancelled"


class Coordinates(BaseModel):
    """Geographic coordinates"""
    lat: float
    lon: float


class Airport(BaseModel):
    """Airport information"""
    airport_code: str = Field(..., description="IATA airport code")
    airport_name: str
    city: str
    country: str
    date: date
    time: time
    timezone: str
    coordinates: Optional[Coordinates] = None


class Aircraft(BaseModel):
    """Aircraft information"""
    model: str
    total_seats: int
    seat_map_url: Optional[str] = None


class Flight(BaseModel):
    """Flight model"""
    id: str = Field(alias="id")
    type: str = "flight"
    flight_number: str = Field(..., description="Flight number (e.g., AA123)")
    airline: str
    departure: Airport
    arrival: Airport
    aircraft: Optional[Aircraft] = None
    created_by: str = Field(..., description="User ID who created the flight")
    participants_count: int = 0
    active_swaps_count: int = 0
    status: FlightStatus = FlightStatus.UPCOMING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "flight_AA123_20260301_MAD",
                "type": "flight",
                "flight_number": "AA123",
                "airline": "American Airlines",
                "departure": {
                    "airport_code": "MAD",
                    "airport_name": "Adolfo Suárez Madrid-Barajas",
                    "city": "Madrid",
                    "country": "Spain",
                    "date": "2026-03-01",
                    "time": "10:00:00",
                    "timezone": "Europe/Madrid",
                    "coordinates": {"lat": 40.4719, "lon": -3.5626}
                },
                "arrival": {
                    "airport_code": "JFK",
                    "airport_name": "John F. Kennedy International",
                    "city": "New York",
                    "country": "USA",
                    "date": "2026-03-01",
                    "time": "13:30:00",
                    "timezone": "America/New_York"
                },
                "aircraft": {
                    "model": "Boeing 777-300ER",
                    "total_seats": 350
                },
                "created_by": "user_12345",
                "status": "upcoming"
            }
        }
