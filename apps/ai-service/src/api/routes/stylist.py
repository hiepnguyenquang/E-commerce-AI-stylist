from fastapi import APIRouter, Security, HTTPException, Header, status
from pydantic import BaseModel
import os

from src.ai.llm_client import get_intent_analyzer
from src.database.search import VectorSearch

# We re-declare verify_internal_token or import it to avoid circular imports.
# In a bigger project, auth should be in a separate file like src/api/dependencies.py.
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "your_super_secret_internal_key_here")

async def verify_internal_token(x_internal_token: str = Header(None)):
    if x_internal_token != INTERNAL_API_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal token"
        )
    return x_internal_token

router = APIRouter()

# Instantiate the search class once to avoid loading the model multiple times if it's heavy,
# but our VectorSearch instantiates EmbeddingModel. This might be better done via Dependency Injection or at startup.
# For MVP, we initialize it globally here.
vector_search = VectorSearch()

# Initialize the Intent Analyzer (Adapter)
llm_client = get_intent_analyzer()

class StylistSearchRequest(BaseModel):
    query_text: str
    limit_options: int = 2
    
@router.post("/search")
async def search_outfit(req: StylistSearchRequest, token: str = Security(verify_internal_token)):
    try:
        # Bước 1: Trích xuất ý định từ câu nói (Extract via LLM)
        filters = llm_client.parse_query(req.query_text)
        
        search_keywords = filters.get("search_keywords", req.query_text)
        
        # Bước 2: Tìm kiếm ngữ nghĩa trên LanceDB (Retrieve)
        # Giới hạn lấy 20 sản phẩm sát nghĩa nhất để cung cấp Pool cho AI
        pool = vector_search.hybrid_search(
            search_keywords=search_keywords,
            filters=filters,
            limit=20
        )
        
        if not pool:
            return {"options": []}
            
        # Bước 3: AI đóng vai Stylist, "nhặt" sản phẩm từ Pool và đưa lời khuyên (Generate)
        outfit_response = llm_client.generate_outfit_options(
            user_query=req.query_text,
            limit_options=req.limit_options,
            available_products=pool
        )
        
        return outfit_response
        
    except Exception as e:
        print(f"[StylistAPI] Error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
