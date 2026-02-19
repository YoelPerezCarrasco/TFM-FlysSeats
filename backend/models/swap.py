"""
Swap request data models
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class SwapStatus(str, Enum):
    """Swap request status"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPLETED = "completed"
    EXPIRED = "expired"


class SwapParticipant(BaseModel):
    """Participant in a swap"""
    user_id: str
    current_seat: str
    seat_id: str


class SwapRequest(BaseModel):
    """Swap request model"""
    id: str = Field(alias="id")
    type: str = "swap_request"
    flight_id: str
    requester: SwapParticipant
    partner: SwapParticipant
    match_score: float = 0.0
    status: SwapStatus = SwapStatus.PENDING
    created_by: str = Field(..., description="algorithm or user_id")
    messages_count: int = 0
    requester_confirmed: bool = False
    partner_confirmed: bool = False
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
