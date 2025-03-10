from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from app.database import db
from app.models.user import UserCreate, User
from app.models.token import Token
from app.services.auth import authenticate_user, create_access_token, get_password_hash
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    access_token = create_access_token(data={"sub": user.username},
                                       expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    if db.users.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = get_password_hash(user.password)
    user_data = {"username": user.username, "email": user.email, "hashed_password": hashed_password,
                 "created_at": datetime.utcnow()}
    result = db.users.insert_one(user_data)

    return User(id=str(result.inserted_id), username=user.username, email=user.email, created_at=datetime.utcnow())
