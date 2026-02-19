"""
Rating data model
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Rating(BaseModel):
    """Rating model"""
    id: str = Field(alias="id")
    type: str = "rating"
    swap_request_id: str
    flight_id: str
    reviewer_id: str
    reviewee_id: str
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
