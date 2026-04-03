from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, func, select
from database.config import get_async_session
from database.models import KnowledgeChunk
from src.schemas.rag import (
    RAGQueryRequest, 
    RAGResponse, 
    RAGSearchRequest, 
    RAGSearchResponse,
    SearchResultItem,
    RAGHealthResponse
)
from src.services.rag.service import RAGService
from src.config import settings

router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/ask", response_model=RAGResponse)
async def ask_question(request: RAGQueryRequest, db: AsyncSession = Depends(get_async_session)):
    try:
        rag_service = RAGService(db)
        response = await rag_service.ask(query=request.query, history=request.history or [])
        return response
    except ValueError as e:
        if "Brak klucza API OpenAI" in str(e):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="System RAG jest tymczasowo niedostępny - brak konfiguracji API OpenAI"
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd podczas przetwarzania zapytania: {str(e)}"
        )

@router.post("/search", response_model=RAGSearchResponse)
async def search_knowledge(request: RAGSearchRequest, db: AsyncSession = Depends(get_async_session)):
    try:
        rag_service = RAGService(db)
        chunks = await rag_service.search_similar_chunks(query=request.query, k=request.k, category=request.category)
        
        results = [
            SearchResultItem(
                id=result.chunk.id,
                title=result.chunk.title,
                category=result.chunk.category,
                content=result.chunk.content,
                similarity=result.similarity,
                source=result.chunk.source
            )
            for result in chunks
        ]
        
        return RAGSearchResponse(results=results, total=len(results), query=request.query)
    except ValueError as e:
        if "Brak klucza API OpenAI" in str(e):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="System RAG jest tymczasowo niedostępny - brak konfiguracji API OpenAI"
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Błąd podczas wyszukiwania: {str(e)}")

@router.get("/health", response_model=RAGHealthResponse)
async def rag_health_check(db: AsyncSession = Depends(get_async_session)):
    try:
        total_result = await db.execute(select(func.count()).select_from(KnowledgeChunk))
        total_chunks = total_result.scalar() or 0
        with_embeddings_result = await db.execute(select(func.count()).select_from(KnowledgeChunk).where(KnowledgeChunk.embedding.is_not(None)))
        chunks_with_embeddings = with_embeddings_result.scalar() or 0
        categories_result = await db.execute(select(KnowledgeChunk.category).distinct())
        categories = [row[0] for row in categories_result.fetchall()]
        openai_configured = bool(settings.OPENAI_API_KEY)
        
        return RAGHealthResponse(
            status="healthy" if openai_configured else "degraded",
            total_chunks=total_chunks,
            chunks_with_embeddings=chunks_with_embeddings,
            categories=categories,
            openai_api_configured=openai_configured
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Błąd podczas sprawdzania statusu: {str(e)}"
        )
