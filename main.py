from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from pydantic import BaseModel
from dotenv import load_dotenv
import os, traceback, logging
from httpx import post
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Optional


Base = declarative_base()

class Article(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, index=True)
    content = Column(String)



load_dotenv()
api_key = os.getenv("MISTRAL_API_KEY")
client = MistralClient(api_key=api_key)
logger = logging.getLogger("uvicorn")
logger.setLevel(logging.DEBUG)

engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Autorise toutes les origines
    allow_credentials=True,
    allow_methods=["*"],  # Autorise toutes les méthodes
    allow_headers=["*"],  # Autorise tous les headers
)

class ChatRequest(BaseModel):
    user_message: str

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/chat")
async def chatbot_endpoint(request: ChatRequest):
    try:
        messages = [ChatMessage(role="user", content=f"Réponds moi en français à {request.user_message}.")]
        chat_response = client.chat(model="mistral-small", messages=messages)

        # Imprimer les informations sur les tokens dans le backend
        print("Tokens utilisés pour la prompt:", chat_response.usage.prompt_tokens)
        print("Total de tokens utilisés:", chat_response.usage.total_tokens)
        print("Tokens utilisés pour la complétion:", chat_response.usage.completion_tokens)

        # Renvoyer uniquement le message de réponse au frontend
        return {'messageResponse': chat_response.choices[0].message}

    except Exception as e:
        logger.error(f"Une erreur est survenue: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ArticleRequest(BaseModel):
    topic: str
    content: Optional[str] = None

@app.post("/generate_article")
async def generate_article_endpoint(request: ArticleRequest):
    print(jsonable_encoder(request))
    try:
        # Préparation du prompt pour la génération de l'article
        messages = [
            ChatMessage(role="user", content=f"Ecrit moi un article détaillé en français sur {request.topic}.")
            # ChatMessage(role="user", content=f"Write a detailed article about {request.topic}.")
        ]

        chat_response = client.chat(
            model="mistral-tiny",  # Remplacez par le modèle de votre choix
            messages=messages,
            # temperature=0.7,  # Ajustez selon le niveau de créativité désiré
            max_tokens=300  # Ajustez selon la longueur d'article souhaitée
        )
        
        # Imprimer les informations sur les tokens dans le backend
        print("Tokens utilisés pour la prompt:", chat_response.usage.prompt_tokens)
        print("Total de tokens utilisés:", chat_response.usage.total_tokens)
        print("Tokens utilisés pour la complétion:", chat_response.usage.completion_tokens)

        # Renvoyer l'article généré au frontend
        generated_article = chat_response.choices[0].message.content
        return {'article': generated_article}

    except Exception as e:
        logger.error(f"Une erreur est survenue: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/articles")
def get_articles(db: Session = Depends(get_db)):
    return db.query(Article).all()

@app.post("/save_article")
async def save_article(article: ArticleRequest, db: Session = Depends(get_db)):
    db_article = Article(topic=article.topic, content=article.content)
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return {"message": "Article saved successfully", "article_id": db_article.id}

@app.delete("/articles/{article_id}")
def delete_article(article_id: int, db: Session = Depends(get_db)):
    article_to_delete = db.query(Article).filter(Article.id == article_id).first()
    if article_to_delete:
        db.delete(article_to_delete)
        db.commit()
        return {"message": "Article deleted"}
    else:
        raise HTTPException(status_code=404, detail="Article not found")


# @app.post("/chat")
# async def chatbot_endpoint(request: ChatRequest):
#     logger.info(f"API Key: {api_key}")
#     try:
#         # Le message de l'utilisateur doit être une chaîne de caractères, pas besoin de l'encoder en bytes
#         response = post(
#             "https://api.mistral.ai/v1/chat/completions",
#             headers={
#                 "Authorization": f"Bearer {api_key}",
#                 "Content-Type": "application/json",
#             },
#             json={
#                 "model": "mistral-tiny",
#                 "messages": [{"role": "user", "content": request.user_message}],
#             },
#         )
#         print(api_key)
#         print(request.json())
#         response.raise_for_status()
#         return response.json()
#     except Exception as e:
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))