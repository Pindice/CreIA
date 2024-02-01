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

# @app.post("/chat")
# async def chatbot_endpoint(request: ChatRequest):
#     try:
#         print(request.user_message)  # Log pour déboguer
#         user_message_encoded = request.user_message.encode('utf-8').decode('utf-8')
#         messages = [ChatMessage(role="user", content=user_message_encoded)]
#         chat_response = client.chat(model="mistral-tiny", messages=messages)
#         return chat_response
#     except Exception as e:
#         print(e)  # Log pour voir l'erreur
#         raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/chat")
async def chatbot_endpoint(request: ChatRequest):
    logger.info(f"API Key: {api_key}")
    try:
        # Le message de l'utilisateur doit être une chaîne de caractères, pas besoin de l'encoder en bytes
        response = post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "mistral-tiny",
                "messages": [{"role": "user", "content": request.user_message}],
            },
        )
        print(api_key)
        print(request.json())
        response.raise_for_status()
        return response.json()
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
