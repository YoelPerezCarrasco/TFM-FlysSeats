"""
Data models for FlysSeats application
"""
from .user import User, UserProfile, UserReputation
from .flight import Flight, Airport, FlightStatus
from .seat import Seat, SeatDetails, SeatPreferences, SeatType, SeatSection
from .swap import SwapRequest, SwapStatus, SwapParticipant
from .message import Message
from .rating import Rating

__all__ = [
    'User', 'UserProfile', 'UserReputation',
    'Flight', 'Airport', 'FlightStatus',
    'Seat', 'SeatDetails', 'SeatPreferences', 'SeatType', 'SeatSection',
    'SwapRequest', 'SwapStatus', 'SwapParticipant',
    'Message',
    'Rating'
]
