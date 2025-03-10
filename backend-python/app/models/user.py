from pydantic import BaseModel
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class User(BaseModel):
    id: str
    username: str
    email: str
    created_at: datetime

class UserInDB(User):
    hashed_password: str
