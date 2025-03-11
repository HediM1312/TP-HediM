from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
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
import base64
import cv2
import numpy as np
from fer import FER
import uuid

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


class ImageData(BaseModel):
    image: str  # Base64 encoded image

# Initialiser le détecteur d'émotions
emotion_detector = FER(mtcnn=True)  # MTCNN pour une détection plus précise

@router.post("/api/emotion")
async def detect_emotion(data: ImageData):
    try:
        # Décoder l'image base64
        image_data = data.image.split(',')[1]  # Enlever le préfixe "data:image/jpeg;base64,"
        image_bytes = base64.b64decode(image_data)
        
        # Convertir en format OpenCV
        image_array = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        # Détecter les émotions
        emotions = emotion_detector.detect_emotions(image)
        
        # Si aucun visage n'est détecté
        if not emotions:
            return {"success": True, "message": "Aucun visage détecté", "emotions": []}
        
        # Extraire le résultat principal
        result = []
        for face in emotions:
            top_emotion = max(face['emotions'].items(), key=lambda x: x[1])
            face_result = {
                "box": face['box'],  # Position du visage
                "emotions": face['emotions'],  # Toutes les émotions détectées
                "dominant_emotion": top_emotion[0],  # Émotion dominante
                "confidence": top_emotion[1]  # Niveau de confiance
            }
            result.append(face_result)
        
        return {
            "success": True,
            "message": "Analyse réussie",
            "emotions": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {str(e)}")



class EmotionReactionCreate(BaseModel):
    tweet_id: str
    user_id: str
    image: str  # Base64 encoded image

class EmotionReaction(BaseModel):
    id: str
    tweet_id: str
    user_id: str
    emotion: str
    confidence: float
    created_at: datetime

# Pour stocker les réactions (remplacez par votre base de données réelle)
emotion_reactions = []

# Initialiser le détecteur d'émotions
emotion_detector = FER(mtcnn=True)

@router.post("/api/tweets/{tweet_id}/reactions", response_model=EmotionReaction)
async def create_emotion_reaction(tweet_id: str, data: EmotionReactionCreate):
    try:
        # Décoder l'image base64
        image_data = data.image.split(',')[1]  # Enlever le préfixe
        image_bytes = base64.b64decode(image_data)
        
        # Convertir en format OpenCV
        image_array = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        # Détecter les émotions
        emotions = emotion_detector.detect_emotions(image)
        
        # Si aucun visage n'est détecté
        if not emotions:
            raise HTTPException(status_code=400, detail="Aucun visage détecté dans l'image")
        
        # Utiliser la première détection (généralement il n'y a qu'un visage)
        face_emotions = emotions[0]['emotions']
        
        # Trouver l'émotion dominante
        dominant_emotion = max(face_emotions.items(), key=lambda x: x[1])
        emotion_name = dominant_emotion[0]
        confidence = dominant_emotion[1]
        
        # Créer la réaction
        # reaction = EmotionReaction(
        #     id=str(uuid.uuid4()),
        #     tweet_id=tweet_id,
        #     user_id=data.user_id,
        #     emotion=emotion_name,
        #     confidence=confidence,
        #     created_at=datetime.now()
        # )
        
        # # Stocker la réaction (ou remplacer si l'utilisateur a déjà réagi)
        # # Supprimer les réactions existantes de l'utilisateur pour ce tweet
        # global emotion_reactions
        # emotion_reactions = [r for r in emotion_reactions 
        #                     if not (r.tweet_id == tweet_id and r.user_id == data.user_id)]

        reaction_id = str(uuid.uuid4())
        reaction_data = {
            "_id": ObjectId(),  # MongoDB utilise _id comme identifiant
            "tweet_id": ObjectId(tweet_id),  # Convertir en ObjectId pour MongoDB
            "user_id": data.user_id,
            "emotion": emotion_name,
            "confidence": confidence,
            "created_at": datetime.now()
        }
        
        # Supprimer toute réaction existante de cet utilisateur pour ce tweet
        db.emotion_reactions.delete_many({
            "tweet_id": ObjectId(tweet_id),
            "user_id": data.user_id
        })
        
        # Insérer la nouvelle réaction en base de données
        db.emotion_reactions.insert_one(reaction_data)


        response_data = {
            "id": str(reaction_data["_id"]),
            "tweet_id": tweet_id,  # Retourner la valeur string originale
            "user_id": reaction_data["user_id"],
            "emotion": reaction_data["emotion"],
            "confidence": reaction_data["confidence"],
            "created_at": reaction_data["created_at"]
        }

        
        return EmotionReaction(**response_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'analyse: {str(e)}")

@router.get("/api/tweets/{tweet_id}/reactions", response_model=List[EmotionReaction])
async def get_tweet_reactions(tweet_id: str):
    try:
        # Récupérer les réactions depuis la base de données
        reactions = list(db.emotion_reactions.find({"tweet_id": ObjectId(tweet_id)}))
        
        # Convertir les objets MongoDB en format compatible avec Pydantic
        result = []
        for reaction in reactions:
            result.append({
                "id": str(reaction["_id"]),
                "tweet_id": tweet_id,
                "user_id": reaction["user_id"],
                "emotion": reaction["emotion"],
                "confidence": reaction["confidence"],
                "created_at": reaction["created_at"]
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des réactions: {str(e)}")


@router.get("/api/tweets/{tweet_id}/reactions/summary")
async def get_tweet_reactions_summary(tweet_id: str):
    try:
        # Récupérer les réactions depuis la base de données
        reactions = list(db.emotion_reactions.find({"tweet_id": ObjectId(tweet_id)}))
        
        # Compter le nombre de chaque émotion
        summary = {}
        for reaction in reactions:
            emotion = reaction["emotion"]
            if emotion in summary:
                summary[emotion] += 1
            else:
                summary[emotion] = 1
        
        return {
            "tweet_id": tweet_id,
            "reaction_count": len(reactions),
            "reactions": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération du résumé des réactions: {str(e)}")
    
@router.delete("/api/tweets/{tweet_id}/reactions/{user_id}", status_code=204)
async def delete_emotion_reaction(tweet_id: str):
    try:
        result = db.emotion_reactions.delete_one({
            "tweet_id": ObjectId(tweet_id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Réaction non trouvée")
            
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")
    

@router.post("/tweets/{tweet_id}/retweet", response_model=Tweet)
async def retweet_tweet(tweet_id: str, current_user: User = Depends(get_current_user)):
    # Vérifier si le tweet existe
    original_tweet = db.tweets.find_one({"_id": ObjectId(tweet_id)})
    if not original_tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")
    
    # Vérifier si l'utilisateur a déjà retweeté ce tweet
    existing_retweet = db.tweets.find_one({
        "original_tweet_id": tweet_id,
        "author_id": current_user.id,
        "is_retweet": True
    })
    
    if existing_retweet:
        raise HTTPException(status_code=400, detail="Tweet already retweeted")
    
    # Créer un retweet
    retweet_data = {
        "author_id": current_user.id,
        "author_username": current_user.username,
        "content": original_tweet["content"],
        "media_url": original_tweet.get("media_url"),
        "is_retweet": True,
        "original_tweet_id": tweet_id,
        "original_author_username": original_tweet["author_username"],
        "created_at": datetime.utcnow(),
        "like_count": 0,
        "comment_count": 0,
        "retweet_count": 0
    }
    
    result = db.tweets.insert_one(retweet_data)
    
    # Mettre à jour le compteur de retweets du tweet original
    db.tweets.update_one(
        {"_id": ObjectId(tweet_id)},
        {"$inc": {"retweet_count": 1}}
    )
    
    # Créer une notification (sauf si l'utilisateur retweete son propre tweet)
    if original_tweet["author_id"] != current_user.id:
        notification_data = {
            "recipient_id": original_tweet["author_id"],
            "sender_id": current_user.id,
            "sender_username": current_user.username,
            "type": "retweet",
            "tweet_id": tweet_id,
            "tweet_content": original_tweet["content"][:50] + ("..." if len(original_tweet["content"]) > 50 else ""),
            "read": False,
            "created_at": datetime.utcnow()
        }
        db.notifications.insert_one(notification_data)
    
    # Préparer les données pour le retour avec l'ID
    response_data = {**retweet_data, "id": str(result.inserted_id)}
    return Tweet(**response_data)

@router.delete("/tweets/{tweet_id}/unretweet", status_code=status.HTTP_204_NO_CONTENT)
async def unretweet_tweet(tweet_id: str, current_user: User = Depends(get_current_user)):
    # Trouver le retweet de l'utilisateur pour ce tweet
    retweet = db.tweets.find_one({
        "original_tweet_id": tweet_id,
        "author_id": current_user.id,
        "is_retweet": True
    })
    
    if not retweet:
        raise HTTPException(status_code=404, detail="Retweet not found")
    
    # Supprimer le retweet
    db.tweets.delete_one({"_id": retweet["_id"]})
    
    # Mettre à jour le compteur de retweets du tweet original
    db.tweets.update_one(
        {"_id": ObjectId(tweet_id)},
        {"$inc": {"retweet_count": -1}}
    )
    
    return None

@router.get("/tweets/{tweet_id}/retweet_status")
async def check_retweet_status(tweet_id: str, current_user: User = Depends(get_current_user)):
    retweet = db.tweets.find_one({
        "original_tweet_id": tweet_id,
        "author_id": current_user.id,
        "is_retweet": True
    })
    
    return {"retweeted": retweet is not None}