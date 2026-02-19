"""
Seat data models
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class SeatType(str, Enum):
    """Seat type enumeration"""
    WINDOW = "WINDOW"
    AISLE = "AISLE"
    MIDDLE = "MIDDLE"


class SeatSection(str, Enum):
    """Seat section in aircraft"""
    FRONT = "FRONT"
    MIDDLE = "MIDDLE"
    BACK = "BACK"


class SeatDetails(BaseModel):
    """Seat physical details"""
    type: SeatType
    section: SeatSection
    row: int
    column: str
    is_emergency_exit: bool = False
    is_reclinable: bool = True
    extra_legroom: bool = False


class SeatPreferences(BaseModel):
    """User preferences for seat swap"""
    desired_type: List[SeatType] = Field(default_factory=list)
    desired_section: Optional[SeatSection] = None
    together_seats: int = 0  # 0 means solo traveler
    emergency_exit: bool = False
    importance_weights: Dict[str, int] = Field(
        default_factory=lambda: {
            "seat_type": 3,
            "section": 3,
            "together_seats": 3,
            "emergency_exit": 3
        }
    )


class Seat(BaseModel):
    """Seat model"""
    id: str = Field(alias="id")
    type: str = "seat"
    flight_id: str
    user_id: str
    seat_number: str = Field(..., description="Seat number (e.g., 12A)")
    seat_details: SeatDetails
    preferences: Optional[SeatPreferences] = None
    open_to_swap: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "seat_AA123_20260301_12A",
                "type": "seat",
                "flight_id": "flight_AA123_20260301_MAD",
                "user_id": "user_12345",
                "seat_number": "12A",
                "seat_details": {
                    "type": "WINDOW",
                    "section": "FRONT",
                    "row": 12,
                    "column": "A",
                    "is_emergency_exit": False,
                    "is_reclinable": True,
                    "extra_legroom": False
                },
                "preferences": {
                    "desired_type": ["AISLE", "WINDOW"],
                    "desired_section": "MIDDLE",
                    "together_seats": 0,
                    "emergency_exit": False,
                    "importance_weights": {
                        "seat_type": 5,
                        "section": 3,
                        "together_seats": 0,
                        "emergency_exit": 2
                    }
                },
                "open_to_swap": True
            }
        }
