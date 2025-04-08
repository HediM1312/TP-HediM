# Twitter Clone - Déploiement Docker

Ce guide explique comment déployer l'application Twitter Clone en utilisant Docker.

## Déploiement

### 1. Cloner le Repository

```bash
git clone https://github.com/HKB06/Twitter2.git
cd Twitter2
```

### 2. Créer le Réseau Docker

```bash
docker network create twitter-network
```

### 3. Déployer MongoDB

```bash
# Créer le volume 
docker volume create mongodb-data

# Lancer le conteneur 
docker run -d --name mongodb --network twitter-network -v mongodb-data:/data/db mongo:latest
```

### 4. Déployer le Backend

```bash
# Construire l'image du backend
docker build -t twitter-backend ./server

# Lancer le conteneur backend
docker run -d --name backend --network twitter-network -p 8000:8000 twitter-backend
```

### 5. Déployer le Frontend

```bash
# Construire l'image du frontend
docker build -t twitter-frontend ./client

# Lancer le conteneur frontend
docker run -d --name frontend --network twitter-network -p 3000:3000 twitter-frontend
```

## Vérification

Une fois tous les conteneurs lancés, vérifiez leur état avec :

```bash
docker ps
```

Vous devriez voir trois conteneurs en cours d'exécution :

- mongodb
- backend
- frontend

## Accès à l'Application

- Frontend : http://localhost:3000
- Backend API : http://localhost:8000

## Arrêt des Conteneurs

Pour arrêter tous les conteneurs :

```bash
docker stop frontend backend mongodb
```

Pour supprimer les conteneurs :

```bash
docker rm frontend backend mongodb
```

Pour supprimer les images :

```bash
docker rmi twitter-frontend twitter-backend
```

Pour supprimer le volume :

```bash
docker volume rm mongodb-data
```

Pour supprimer le réseau :

```bash
docker network rm twitter-network
```

## Architecture

L'application est composée de trois services :

1. **Frontend (Next.js)**

   - Port : 3000
   - Communique avec le backend via le réseau Docker

2. **Backend (Python FastAPI)**

   - Port : 8000
   - Communique avec MongoDB via le réseau Docker

3. **MongoDB**
   - Port : 27017 (interne)
   - Stockage persistant via volume Docker

Les services communiquent entre eux via le réseau Docker `twitter-network` en utilisant leurs noms comme hôtes :

- Frontend → Backend : `http://backend:8000`
- Backend → MongoDB : `mongodb://mongodb:27017`
