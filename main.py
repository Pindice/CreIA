from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage
from pydantic import BaseModel
from dotenv import load_dotenv
import os, traceback, logging
from httpx import post


load_dotenv()
api_key = os.getenv("MISTRAL_API_KEY")
client = MistralClient(api_key=api_key)
logger = logging.getLogger("uvicorn")
logger.setLevel(logging.DEBUG)

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

@app.post("/chat")
async def chatbot_endpoint(request: ChatRequest):
    try:
        messages = [ChatMessage(role="user", content=request.user_message)]
        chat_response = client.chat(model="mistral-tiny", messages=messages)

        # Imprimer les informations sur les tokens dans le backend
        print("Tokens utilisés pour la prompt:", chat_response.usage.prompt_tokens)
        print("Total de tokens utilisés:", chat_response.usage.total_tokens)
        print("Tokens utilisés pour la complétion:", chat_response.usage.completion_tokens)

        # Renvoyer uniquement le message de réponse au frontend
        return {'messageResponse': chat_response.choices[0].message}

    except Exception as e:
        logger.error(f"Une erreur est survenue: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

class ArticleRequest(BaseModel):
    topic: str  # Le sujet de l'article à générer

@app.post("/generate_article")
async def generate_article_endpoint(request: ArticleRequest):
    try:
        # Préparation du prompt pour la génération de l'article
        messages = [
            ChatMessage(role="user", content=f"Write a detailed article about {request.topic}.")
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