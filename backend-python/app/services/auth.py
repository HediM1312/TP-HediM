from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
import jwt
import bcrypt
from app.config import SECRET_KEY, ALGORITHM
from app.database import db
from app.models.user import UserInDB
from app.models.token import TokenData

from fastapi import HTTPException, Depends, status

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_password_hash(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())

def verify_password(plain_password, hashed_password):
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode()
    return bcrypt.checkpw(plain_password.encode(), hashed_password)

def get_user(username: str):
    user = db.users.find_one({"username": username})
    if user:
        user["id"] = str(user["_id"])
        return UserInDB(**user)
    return None

def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    user = get_user(username=username)
    if user is None:
        raise credentials_exception
    return user
