from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import gridfs

# Charger les variables d'environnement
load_dotenv()

# Connexion MongoDB
MONGO_URL = "mongodb://mongodb:27017"
client = AsyncIOMotorClient(MONGO_URL)
db = client.twitter_db

fs = gridfs.GridFS(db, collection="media")