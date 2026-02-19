"""
Message data model
"""
from pydantic import BaseModel, Field
from datetime import datetime


class Message(BaseModel):
    """Message model for chat"""
    id: str = Field(alias="id")
    type: str = "message"
    swap_request_id: str
    sender_id: str
    receiver_id: str
    content: str
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
