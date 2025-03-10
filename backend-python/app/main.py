from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import routers

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Ajoute toutes les routes automatiquement
for router in routers:
    app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
