from pydantic import BaseModel
from datetime import datetime

class FollowCreate(BaseModel):
    following_id: str

class Follow(BaseModel):
    id: str
    follower_id: str
    following_id: str
    created_at: datetime