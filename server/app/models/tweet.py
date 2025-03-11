from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TweetCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    original_tweet_id: Optional[str] = None

class Tweet(BaseModel):
    id: str
    content: str
    author_id: str
    author_username: str
    created_at: datetime
    like_count: int = 0
    comment_count: int = 0
    retweet_count: int = 0  # Ajout
    is_retweet: bool = False  # Ajout
    original_tweet_id: Optional[str] = None  # Ajout
    original_author_username: Optional[str] = None  # Ajout