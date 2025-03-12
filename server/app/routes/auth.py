from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from typing import List
from app.database import db
from app.models import UserCreate, User
from app.models.follow import Follow
from app.models.tweet import Tweet
from app.models.token import Token
from app.services.auth import authenticate_user, create_access_token, get_password_hash, get_current_user
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES
from bson import ObjectId

router = APIRouter(prefix="", tags=["Authentication"])


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    if db.users.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already taken")

    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow()
    }
    result = db.users.insert_one(user_data)
    return User(id=str(result.inserted_id), **user_data)


@router.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    user_data = {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "created_at": current_user.created_at
    }
    return user_data

@router.get("/users/{username}/tweets", response_model=List[Tweet])
async def read_user_tweets(username: str):
    tweets = []
    for tweet in db.tweets.find({"author_username": username}).sort("created_at", -1):
        tweet["id"] = str(tweet["_id"])
        del tweet["_id"]
        tweets.append(Tweet(**tweet))
    return tweets


@router.post("/users/{username}/follow", response_model=Follow)
async def follow_user(username: str, current_user: User = Depends(get_current_user)):
    # Vérifier si l'utilisateur à suivre existe
    user_to_follow = db.users.find_one({"username": username})
    if not user_to_follow:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Convertir l'ID en string pour faciliter les comparaisons
    user_to_follow_id = str(user_to_follow["_id"])
    
    # Vérifier que l'utilisateur ne tente pas de se suivre lui-même
    if current_user.id == user_to_follow_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous suivre vous-même")
    
    # Vérifier si déjà suivi
    existing_follow = db.follows.find_one({
        "follower_id": current_user.id,
        "followed_id": user_to_follow_id
    })
    
    if existing_follow:
        raise HTTPException(status_code=400, detail="Vous suivez déjà cet utilisateur")
    
    # Créer la relation de suivi
    follow_data = {
        "follower_id": current_user.id,
        "follower_username": current_user.username,
        "followed_id": user_to_follow_id,
        "followed_username": username,
        "created_at": datetime.utcnow()
    }
    
    result = db.follows.insert_one(follow_data)
    follow_data["id"] = str(result.inserted_id)
    
    # Mettre à jour les compteurs de followers/following
    db.users.update_one(
        {"_id": ObjectId(user_to_follow_id)},
        {"$inc": {"followers_count": 1}}
    )
    
    db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$inc": {"following_count": 1}}
    )
    
    # Créer une notification pour l'utilisateur suivi
    notification_data = {
        "recipient_id": user_to_follow_id,
        "sender_id": current_user.id,
        "sender_username": current_user.username,
        "type": "follow",
        "read": False,
        "created_at": datetime.utcnow()
    }
    db.notifications.insert_one(notification_data)
    
    return Follow(**follow_data)

@router.delete("/users/{username}/unfollow", status_code=status.HTTP_204_NO_CONTENT)
async def unfollow_user(username: str, current_user: User = Depends(get_current_user)):
    # Vérifier si l'utilisateur à ne plus suivre existe
    user_to_unfollow = db.users.find_one({"username": username})
    if not user_to_unfollow:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user_to_unfollow_id = str(user_to_unfollow["_id"])
    
    # Vérifier si la relation de suivi existe
    follow = db.follows.find_one({
        "follower_id": current_user.id,
        "followed_id": user_to_unfollow_id
    })
    
    if not follow:
        raise HTTPException(status_code=404, detail="Vous ne suivez pas cet utilisateur")
    
    # Supprimer la relation de suivi
    db.follows.delete_one({"_id": follow["_id"]})
    
    # Mettre à jour les compteurs
    db.users.update_one(
        {"_id": ObjectId(user_to_unfollow_id)},
        {"$inc": {"followers_count": -1}}
    )
    
    db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$inc": {"following_count": -1}}
    )
    
    return None

@router.get("/users/{username}/follow_status")
async def check_follow_status(username: str, current_user: User = Depends(get_current_user)):
    # Vérifier si l'utilisateur existe
    user = db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user_id = str(user["_id"])
    
    # Vérifier si l'utilisateur courant suit cet utilisateur
    follow = db.follows.find_one({
        "follower_id": current_user.id,
        "followed_id": user_id
    })
    
    return {"following": follow is not None}

@router.get("/users/{username}/followers", response_model=List[User])
async def get_user_followers(username: str):
    # Vérifier si l'utilisateur existe
    user = db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user_id = str(user["_id"])
    
    # Récupérer les relations de suivi où cet utilisateur est suivi
    follows = db.follows.find({"followed_id": user_id})
    
    # Récupérer les données des utilisateurs qui suivent
    followers = []
    for follow in follows:
        follower = db.users.find_one({"_id": ObjectId(follow["follower_id"])})
        if follower:
            followers.append({
                "id": str(follower["_id"]),
                "username": follower["username"],
                "email": follower["email"],
                "bio": follower.get("bio"),
                "profile_picture_url": follower.get("profile_picture_url"),
                "followers_count": follower.get("followers_count", 0),
                "following_count": follower.get("following_count", 0),
                "created_at": follower["created_at"]
            })
    
    return followers

@router.get("/users/{username}/following", response_model=List[User])
async def get_user_following(username: str):
    # Vérifier si l'utilisateur existe
    user = db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user_id = str(user["_id"])
    
    # Récupérer les relations de suivi où cet utilisateur suit d'autres
    follows = db.follows.find({"follower_id": user_id})
    
    # Récupérer les données des utilisateurs suivis
    following = []
    for follow in follows:
        followed = db.users.find_one({"_id": ObjectId(follow["followed_id"])})
        if followed:
            following.append({
                "id": str(followed["_id"]),
                "username": followed["username"],
                "email": followed["email"],
                "bio": followed.get("bio"),
                "profile_picture_url": followed.get("profile_picture_url"),
                "followers_count": followed.get("followers_count", 0),
                "following_count": followed.get("following_count", 0),
                "created_at": followed["created_at"]
            })
    
    return following

@router.get("/users/{username}/stats")
async def get_user_stats(username: str):
    # Vérifier si l'utilisateur existe
    user = db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return {
        "followers_count": user.get("followers_count", 0),
        "following_count": user.get("following_count", 0)
    }

@router.get("/users/{username}/liked-tweets", response_model=List[Tweet])
async def get_user_liked_tweets(username: str):
    # Vérifier si l'utilisateur existe
    user = db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    user_id = str(user["_id"])
    
    # Récupérer tous les likes de l'utilisateur
    likes = list(db.likes.find({"user_id": user_id}))
    tweet_ids = [ObjectId(like["tweet_id"]) for like in likes]
    
    # Récupérer les tweets correspondants
    liked_tweets = []
    if tweet_ids:
        for tweet in db.tweets.find({"_id": {"$in": tweet_ids}}).sort("created_at", -1):
            tweet["id"] = str(tweet["_id"])
            del tweet["_id"]
            liked_tweets.append(Tweet(**tweet))
    
    return liked_tweets

@router.get("/users/{username}/retweeted-tweets", response_model=List[Tweet])
async def get_user_retweeted_tweets(username: str):
    # Récupérer les retweets (tweets où is_retweet est True et author_username est l'utilisateur)
    retweeted_tweets = []
    for tweet in db.tweets.find({"author_username": username, "is_retweet": True}).sort("created_at", -1):
        tweet["id"] = str(tweet["_id"])
        del tweet["_id"]
        retweeted_tweets.append(Tweet(**tweet))
    
    return retweeted_tweets
