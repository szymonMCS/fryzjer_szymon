from typing import List, Optional, Any
from uuid import UUID
from pydantic import BaseModel, Field


class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="Pytanie użytkownika")
    history: Optional[List[dict]] = Field(default=None, description="Historia rozmowy")
    category: Optional[str] = Field(default=None, description="Opcjonalna kategoria do filtrowania")


class RAGSource(BaseModel):
    title: str
    category: str
    similarity: float
    content_preview: str


class RAGResponse(BaseModel):
    answer: str
    sources: List[RAGSource]
    confidence: float
    query_time_ms: int


class RAGSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    k: int = Field(default=10, ge=1, le=50, description="Liczba wyników")
    category: Optional[str] = Field(default=None)


class SearchResultItem(BaseModel):
    id: UUID
    title: str
    category: str
    content: str
    similarity: float
    source: Optional[str]


class RAGSearchResponse(BaseModel):
    results: List[SearchResultItem]
    total: int
    query: str


class KnowledgeSyncStatus(BaseModel):
    last_sync: Optional[str]
    pending_changes: int
    total_chunks: int
    is_syncing: bool


class RAGHealthResponse(BaseModel):
    status: str
    total_chunks: int
    chunks_with_embeddings: int
    categories: List[str]
    openai_api_configured: bool


class KnowledgeUploadResponse(BaseModel):
    success: bool
    filename: str
    chunks_created: int
    message: str


class KnowledgeFile(BaseModel):
    name: str
    size: int
    modified_at: str


class KnowledgeFileList(BaseModel):
    items: List[KnowledgeFile]
    total: int


class KnowledgeFileContent(BaseModel):
    name: str
    content: str


class KnowledgeFileUpdate(BaseModel):
    content: str


class KnowledgeSyncResponse(BaseModel):
    success: bool
    files_processed: int
    chunks_created: int
    message: str
