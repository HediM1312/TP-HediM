from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from app.database import db
from app.models.tweet import TweetCreate, Tweet
from app.models.comment import Comment, CommentCreate
from app.models.like import Like
from app.models.user import User
from app.models.notification import Notification
from app.services.auth import get_current_user
from datetime import datetime

router = APIRouter()

@router.post("/tweets", response_model=Tweet)
async def create_tweet(tweet: TweetCreate, current_user=Depends(get_current_user)):

    tweet_data = {
        "author_id": current_user.id,
        "author_username": current_user.username,
        "content": tweet.content,
        "media_url": tweet.media_url if tweet.media_url else None,
        "created_at": datetime.utcnow()
    }
    result = db.tweets.insert_one(tweet_data)
    return Tweet(id=str(result.inserted_id), **tweet_data)

@router.get("/tweets", response_model=List[Tweet])
async def read_tweets():
    tweets = [{"id": str(tweet["_id"]), **tweet} for tweet in db.tweets.find().sort("created_at", -1).limit(50)]
    return tweets

@router.get("/tweets/{tweet_id}/like_status")
async def check_like_status(tweet_id: str, current_user: User = Depends(get_current_user)):
    like = db.likes.find_one({
        "tweet_id": tweet_id,
        "user_id": current_user.id
    })
    return {"liked": like is not None}

@router.post("/comments", response_model=Comment)
async def create_comment(comment: CommentCreate, current_user: User = Depends(get_current_user)):
    # Vérifier si le tweet existe
    tweet = db.tweets.find_one({"_id": ObjectId(comment.tweet_id)})
    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")
    
    comment_data = {
        "content": comment.content,
        "tweet_id": comment.tweet_id,
        "author_id": current_user.id,
        "author_username": current_user.username,
        "created_at": datetime.utcnow()
    }
    
    result = db.comments.insert_one(comment_data)
    comment_id = str(result.inserted_id)
    comment_data["id"] = comment_id
    
    # Mettre à jour le compteur de commentaires dans le tweet
    db.tweets.update_one(
        {"_id": ObjectId(comment.tweet_id)},
        {"$inc": {"comment_count": 1}}
    )
    
    # Créer une notification (sauf si l'utilisateur commente son propre tweet)
    if tweet["author_id"] != current_user.id:
        notification_data = {
            "recipient_id": tweet["author_id"],
            "sender_id": current_user.id,
            "sender_username": current_user.username,
            "type": "comment",
            "tweet_id": comment.tweet_id,
            "tweet_content": tweet["content"][:50] + ("..." if len(tweet["content"]) > 50 else ""),
            "comment_id": comment_id,
            "comment_content": comment.content[:50] + ("..." if len(comment.content) > 50 else ""),
            "read": False,
            "created_at": datetime.utcnow()
        }
        db.notifications.insert_one(notification_data)
    
    return Comment(**comment_data)

@router.get("/tweets/{tweet_id}/comments", response_model=List[Comment])
async def get_tweet_comments(tweet_id: str):
    comments = []
    for comment in db.comments.find({"tweet_id": tweet_id}).sort("created_at", -1):
        comment["id"] = str(comment["_id"])
        del comment["_id"]
        comments.append(Comment(**comment))
    return comments

@router.post("/tweets/{tweet_id}/like", response_model=Like)
async def like_tweet(tweet_id: str, current_user: User = Depends(get_current_user)):
    # Vérifier si le tweet existe
    tweet = db.tweets.find_one({"_id": ObjectId(tweet_id)})
    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")
    
    # Vérifier si l'utilisateur a déjà liké ce tweet
    existing_like = db.likes.find_one({
        "tweet_id": tweet_id,
        "user_id": current_user.id
    })
    
    if existing_like:
        raise HTTPException(status_code=400, detail="Tweet already liked")
    
    like_data = {
        "tweet_id": tweet_id,
        "user_id": current_user.id,
        "username": current_user.username,
        "created_at": datetime.utcnow()
    }
    
    result = db.likes.insert_one(like_data)
    like_data["id"] = str(result.inserted_id)
    
    # Mettre à jour le compteur de likes dans le tweet
    db.tweets.update_one(
        {"_id": ObjectId(tweet_id)},
        {"$inc": {"like_count": 1}}
    )
    
    # Créer une notification (sauf si l'utilisateur like son propre tweet)
    if tweet["author_id"] != current_user.id:
        notification_data = {
            "recipient_id": tweet["author_id"],
            "sender_id": current_user.id,
            "sender_username": current_user.username,
            "type": "like",
            "tweet_id": tweet_id,
            "tweet_content": tweet["content"][:50] + ("..." if len(tweet["content"]) > 50 else ""),
            "read": False,
            "created_at": datetime.utcnow()
        }
        db.notifications.insert_one(notification_data)
    
    return Like(**like_data)

@router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = []
    for notification in db.notifications.find({"recipient_id": current_user.id}).sort("created_at", -1).limit(50):
        notification["id"] = str(notification["_id"])
        del notification["_id"]
        notifications.append(Notification(**notification))
    return notifications

@router.get("/notifications/count", response_model=dict)
async def get_unread_notifications_count(current_user: User = Depends(get_current_user)):
    count = db.notifications.count_documents({
        "recipient_id": current_user.id,
        "read": False
    })
    return {"count": count}

@router.put("/notifications/read-all")
async def mark_all_notifications_as_read(current_user: User = Depends(get_current_user)):
    db.notifications.update_many(
        {"recipient_id": current_user.id, "read": False},
        {"$set": {"read": True}}
    )
    
    return {"success": True}


@router.delete("/tweets/{tweet_id}/unlike", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_tweet(tweet_id: str, current_user: User = Depends(get_current_user)):
    # Vérifier si le tweet existe
    tweet = db.tweets.find_one({"_id": ObjectId(tweet_id)})
    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")
    
    # Vérifier si l'utilisateur a liké ce tweet
    like = db.likes.find_one({
        "tweet_id": tweet_id,
        "user_id": current_user.id
    })
    
    if not like:
        raise HTTPException(status_code=404, detail="Like not found")
    
    # Supprimer le like
    db.likes.delete_one({"_id": like["_id"]})
    
    # Mettre à jour le compteur de likes dans le tweet
    db.tweets.update_one(
        {"_id": ObjectId(tweet_id)},
        {"$inc": {"like_count": -1}}
    )
    
    return None