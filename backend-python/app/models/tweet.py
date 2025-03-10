from pydantic import BaseModel
from datetime import datetime

class TweetCreate(BaseModel):
    content: str

class Tweet(BaseModel):
    id: str
    content: str
    author_id: str
    author_username: str
    created_at: datetime
    like_count: int = 0
    comment_count: int = 0
