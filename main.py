from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
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
from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta


Base = declarative_base()

class Article(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, index=True)
    content = Column(String)

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)  # Make sure to hash passwords!

load_dotenv()
api_key = os.getenv("MISTRAL_API_KEY")
client = MistralClient(api_key=api_key)
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
HTTP_401_UNAUTHORIZED = status.HTTP_401_UNAUTHORIZED
logger = logging.getLogger("uvicorn")
logger.setLevel(logging.DEBUG)

engine = create_engine(os.getenv("DATABASE_URL"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
            ChatMessage(role="user", content=f"Ecrit moi un article en HTML détaillé en français sur {request.topic}.")
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

#LOGIN    
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Assurez-vous que hashed_password est un bytes si nécessaire
    hashed_password_bytes = hashed_password.encode('utf-8')
    plain_password_bytes = plain_password.encode('utf-8')
    return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        user = db.query(Admin).filter(Admin.username == username).first()
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception
    
class Token(BaseModel):
    access_token: str
    token_type: str
    
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(Admin).filter(Admin.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


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