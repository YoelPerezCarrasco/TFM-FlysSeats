"""
User data models
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserProfile(BaseModel):
    """User profile information"""
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    preferred_language: str = "en"


class UserReputation(BaseModel):
    """User reputation and statistics"""
    rating: float = 0.0
    total_reviews: int = 0
    total_swaps: int = 0
    completed_swaps: int = 0
    cancelled_swaps: int = 0
    percentage_completed: float = 0.0


class User(BaseModel):
    """User model"""
    id: str = Field(alias="id")
    type: str = "user"
    email: EmailStr
    name: str
    phone: Optional[str] = None
    password_hash: Optional[str] = None  # Not returned in API responses
    profile: UserProfile = Field(default_factory=UserProfile)
    reputation: UserReputation = Field(default_factory=UserReputation)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "user_12345",
                "type": "user",
                "email": "user@example.com",
                "name": "John Doe",
                "phone": "+1234567890",
                "profile": {
                    "avatar_url": "https://example.com/avatar.jpg",
                    "bio": "Frequent traveler",
                    "preferred_language": "en"
                },
                "reputation": {
                    "rating": 4.7,
                    "total_reviews": 23,
                    "total_swaps": 25,
                    "completed_swaps": 23,
                    "cancelled_swaps": 2,
                    "percentage_completed": 92.0
                }
            }
        }
