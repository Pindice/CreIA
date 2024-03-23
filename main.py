from fastapi import FastAPI, HTTPException, status, UploadFile, APIRouter, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from pydantic import BaseModel
from dotenv import load_dotenv
import os, traceback, logging
from httpx import post
from sqlalchemy import func, Column, Integer, String, DateTime, ForeignKey, Boolean, desc, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta
import shutil


Base = declarative_base()

class Article(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)  # Add title field
    topic = Column(String, index=True)
    instructions = Column(String)
    content = Column(String)
    image = Column(String)  # Store image URL or path
    last_date = Column(DateTime, default=datetime.utcnow)  # To track the last update
    is_temporary = Column(Boolean, default=True)  # Champ pour marquer l'article comme temporaire

    
    # Relationship with Article History
    history = relationship("ArticleHistory", back_populates="article")

class ArticleHistory(Base):
    __tablename__ = "articles_history"
    id = Column(Integer, primary_key=True, index=True)
    date_modif = Column(DateTime, default=datetime.utcnow)
    previous_instructions = Column(String)
    previous_content = Column(String)
    admin_id = Column(Integer, ForeignKey('admins.id'))
    article_id = Column(Integer, ForeignKey('articles.id'))
    
    # Relationships
    article = relationship("Article", back_populates="history")
    admin = relationship("Admin")

class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)  # Make sure to hash passwords!

    # Relationship with Create Action
    created_articles = relationship("Article", secondary="create")

class Create(Base):
    __tablename__ = "create"
    admin_id = Column(Integer, ForeignKey('admins.id'), primary_key=True)
    article_id = Column(Integer, ForeignKey('articles.id'), primary_key=True)

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

router = APIRouter()

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
        # Renvoyer uniquement le message de réponse au frontend
        return {'messageResponse': chat_response.choices[0].message}

    except Exception as e:
        logger.error(f"Une erreur est survenue: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ArticleRequest(BaseModel):
    topic: str
    instructions: str
    content: Optional[str] = None

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/generate_article")
async def generate_article_endpoint(request: ArticleRequest, db: Session = Depends(get_db)):
    print(jsonable_encoder(request))
    try:
        # Préparation du prompt pour la génération de l'article
        messages = [
            ChatMessage(role="user", content=f"Rédige moi un article détaillé en lien avec la création d'entreprise en France, en HTML respectant les normes W3C et en français sur {request.topic} en suivant ces instructions : {request.instructions}")
            # ChatMessage(role="user", content=f"Write a detailed article about {request.topic}.")
        ]

        chat_response = client.chat(
            model="mistral-tiny",  # Remplacez par le modèle de votre choix
            messages=messages,
            # temperature=0.7,  # Ajustez selon le niveau de créativité désiré
            max_tokens=1000  # Ajustez selon la longueur d'article souhaitée
        )

        # Renvoyer l'article généré au frontend
        generated_article = chat_response.choices[0].message.content

        # Création d'une nouvelle instance d'Article
        new_article = Article(
            title=request.topic,  # Vous devez générer le titre séparément si nécessaire
            topic=request.topic,
            instructions=request.instructions,
            content=generated_article,
            image=None,  # Vous ajouterez l'image plus tard si nécessaire
            last_date=datetime.utcnow(),
            is_temporary=True
        )
        db.add(new_article)
        db.commit()
        db.refresh(new_article)
        
        # Création de la première entrée d'historique
        new_history = ArticleHistory(
            article_id=new_article.id,
            previous_instructions=new_article.instructions,
            previous_content=new_article.content,
            date_modif=datetime.utcnow(),
            admin_id=None  # Vous devez déterminer quel admin est connecté et passer son ID
        )
        db.add(new_history)
        db.commit()

        return {'article': generated_article, 'article_id': new_article.id}
    
    except Exception as e:
        db.rollback()  # Important en cas d'échec, pour ne pas laisser la DB dans un état incohérent
        logger.error(f"Une erreur est survenue: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@app.get("/articles")
def get_articles(skip: int = 0, limit: int = 100, consider_date: bool = True, db: Session = Depends(get_db)):
    if consider_date:
        current_time = datetime.utcnow()
        articles = db.query(Article).filter(Article.last_date <= current_time).order_by(desc(Article.last_date)).offset(skip).limit(limit).all()
    else:
        articles = db.query(Article).order_by(desc(Article.last_date)).offset(skip).limit(limit).all()
    return articles

@app.post("/generate_title")
async def generate_title(content: str):
    # Utilisez ici votre modèle pour générer un titre à partir du contenu
    generated_title = "Titre généré par le modèle"
    return {"title": generated_title}

@app.post("/upload_image")
async def upload_image(image: UploadFile = File(...)):
    folder = 'images/'
    file_location = f"{folder}{image.filename}"
    os.makedirs(folder, exist_ok=True)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    return {"image_path": file_location}    

@app.post("/save_article")
async def save_article(
    article_id: int = Form(...),  # ID de l'article temporaire à mettre à jour
    topic: str = Form(...), 
    instructions: str = Form(None),
    content: str = Form(...), 
    image: UploadFile = File(None),  # Téléchargement d'image optionnel
    db: Session = Depends(get_db)
):
    # Recherche de l'article temporaire par son ID
    temp_article = db.query(Article).filter_by(id=article_id, is_temporary=True).first()

    if temp_article:
        # Mise à jour de l'article temporaire si trouvé
        temp_article.topic = topic.strip()
        temp_article.content = content.strip()
        temp_article.last_date = datetime.utcnow()
        temp_article.is_temporary = False  # Marquez l'article comme définitif

        if image:
            # Gestion de l'image si fournie
            image_path = os.path.join("images", image.filename)
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            temp_article.image = image_path

        # Création d'une entrée d'historique pour cette mise à jour
        history_entry = ArticleHistory(
            article_id=temp_article.id,
            previous_instructions=temp_article.instructions,
            previous_content=temp_article.content,
            date_modif=datetime.utcnow(),
            admin_id=None  # Assurez-vous d'assigner le bon admin_id
        )
        db.add(history_entry)
        db.commit()

        logger.info(f"Article updated successfully with ID: {temp_article.id}")
        return {"message": "Article updated successfully", "article_id": temp_article.id}
    else:
        # Si l'article temporaire n'est pas trouvé, considérez comme une nouvelle sauvegarde
        new_article = Article(
            title=topic.strip(),
            topic=topic.strip(),
            instructions=instructions.strip(),
            content=content.strip(),
            last_date=datetime.utcnow(),
            is_temporary=False  # L'article est directement marqué comme définitif
        )

        if image:
            # Gestion de l'image pour le nouvel article
            image_path = os.path.join("images", image.filename)
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            new_article.image = image_path

        db.add(new_article)
        db.commit()
        db.refresh(new_article)

        logger.info(f"New article saved successfully with ID: {new_article.id}")
        return {"message": "New article saved successfully", "article_id": new_article.id}


class RegenerateArticleRequest(BaseModel):
    topic: Optional[str] = None
    instructions: str

@router.post("/regenerate_article/{article_id}")
async def regenerate_article(article_id: int, request: RegenerateArticleRequest, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Utiliser la logique de génération d'article avec les nouvelles instructions
    # Similaire à l'endpoint /generate_article mais avec request.instructions
    messages = [
        ChatMessage(role="user", content=f"Rédige moi un article détaillé en lien avec la création d'entreprise en France, en HTML respectant les normes W3C et en français sur {request.topic} en suivant ces instructions : {request.instructions}")
    ]

    chat_response = client.chat(
        model="mistral-tiny",  # Ou tout autre modèle de votre choix
        messages=messages,
        max_tokens=300
    )

    new_content = chat_response.choices[0].message.content

    # Enregistrer les modifications dans l'historique sans mettre à jour l'article original
    new_history = ArticleHistory(
        article_id=article.id,
        previous_instructions=article.instructions,
        previous_content=article.content,
        date_modif=datetime.utcnow(),
        admin_id=None  # Assurez-vous d'identifier correctement l'admin
    )
    if request.topic:
        article.topic = request.topic
    article.instructions = request.instructions
    article.content = new_content
    db.add(new_history)
    db.commit()

    return {"message": "Article regenerated and history entry created", "new_content": new_content}


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

@app.get("/articles/{article_id}")
async def get_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@app.put("/articles/{article_id}")
async def update_article(
    article_id: int,
    title: str = Form(...),
    topic: str = Form(...),
    instructions: str = Form(None),
    content: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: Admin = Depends(get_current_user)
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Mettre à jour l'article avec les nouvelles informations
    article.title = title
    article.topic = topic
    article.instructions = instructions
    article.content = content
    article.last_date = datetime.utcnow()

    if image:
        # Sauvegardez le fichier d'image comme requis, par exemple dans un dossier statique
        image_path = os.path.join("images", image.filename)
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        article.image = image_path

    # Enregistrer la mise à jour dans l'historique après avoir appliqué les modifications
    history_entry = ArticleHistory(
        article_id=article.id,
        previous_instructions  = article.instructions ,  # Utiliser les nouvelles valeurs
        previous_content = article.content,  # Utiliser les nouvelles valeurs
        date_modif=datetime.utcnow(),
        admin_id=current_user.id
    )
    db.add(history_entry)

    db.commit()

    return {"message": "Article updated", "article_id": article.id}

@app.get("/article_history/{article_id}")
def get_article_history(article_id: int, db: Session = Depends(get_db)):
    history = db.query(ArticleHistory).filter(ArticleHistory.article_id == article_id).all()
    return history

# Configuration pour servir les fichiers statiques
app.mount("/images", StaticFiles(directory="images"), name="images")

app.include_router(router)
