from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models import KnowledgeChunk
from src.schemas.rag import (
    RAGQueryRequest,
    RAGResponse,
    RAGSearchRequest,
    RAGSearchResponse,
    SearchResultItem,
    RAGHealthResponse,
)
from src.api.deps import get_knowledge_service, get_booking_agent_service, get_db
from src.services.rag.knowledge_service import KnowledgeRAGService
from src.services.rag.booking_agent import BookingAgentService
from src.config import settings

router = APIRouter(prefix="/rag", tags=["rag"])

FORBIDDEN_PHRASES = ["system:", "ignore previous", "you are now", "as an ai", "ignore all"]

def _sanitize_query(query: str) -> str:
    lower_query = query.lower()
    for phrase in FORBIDDEN_PHRASES:
        if phrase in lower_query:
            raise ValueError("Nieprawidłowe zapytanie")
    return query[:2000]

@router.post("/ask", response_model=RAGResponse)
async def ask_question(query_req: RAGQueryRequest, booking_agent: BookingAgentService = Depends(get_booking_agent_service)):
    try:
        query = _sanitize_query(query_req.query)
        if query_req.confirmation:
            query = f"{query} (potwierdzenie: {query_req.confirmation})"

        response = await booking_agent.ask(query=query, history=query_req.history or [], session_id=query_req.session_id)

        return RAGResponse(
            answer=response.answer,
            session_id=response.session_id,
            requires_confirmation=response.requires_confirmation
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd podczas przetwarzania zapytania: {str(e)}"
        )

@router.post("/search", response_model=RAGSearchResponse)
async def search_knowledge(request: RAGSearchRequest, knowledge_service: KnowledgeRAGService = Depends(get_knowledge_service)):
    try:
        if not settings.OPENAI_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Brak konfiguracji API OpenAI"
            )

        results = await knowledge_service.search_similar(request.query, k=request.k, category=request.category)

        return RAGSearchResponse(
            results=[
                SearchResultItem(
                    id=r.chunk.id,
                    title=r.chunk.title,
                    category=r.chunk.category,
                    content=r.chunk.content,
                    similarity=r.similarity,
                    source=r.chunk.source
                )
                for r in results
            ],
            total=len(results),
            query=request.query
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd podczas wyszukiwania: {str(e)}"
        )

@router.get("/health", response_model=RAGHealthResponse)
async def rag_health_check(db: AsyncSession = Depends(get_db)):
    try:
        total_result = await db.execute(select(func.count()).select_from(KnowledgeChunk))
        total_chunks = total_result.scalar() or 0

        with_embeddings_result = await db.execute(select(func.count()).select_from(KnowledgeChunk).where(KnowledgeChunk.embedding.is_not(None)))
        chunks_with_embeddings = with_embeddings_result.scalar() or 0

        categories_result = await db.execute(select(KnowledgeChunk.category).distinct())
        categories = [row[0] for row in categories_result.fetchall()]

        return RAGHealthResponse(
            status="healthy" if settings.OPENAI_API_KEY else "degraded",
            total_chunks=total_chunks,
            chunks_with_embeddings=chunks_with_embeddings,
            categories=categories,
            openai_api_configured=bool(settings.OPENAI_API_KEY)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd podczas sprawdzania statusu: {str(e)}"
        )
