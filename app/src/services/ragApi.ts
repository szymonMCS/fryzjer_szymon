/**
 * API client dla RAG (Retrieval Augmented Generation)
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface RAGQueryRequest {
  query: string;
  history?: { role: string; content: string }[];
  category?: string;
}

export interface RAGResponse {
  answer: string;
  sources: {
    title: string;
    category: string;
    similarity: number;
    content_preview: string;
  }[];
  confidence: number;
  query_time_ms: number;
}

export interface KnowledgeChunk {
  id: string;
  category: string;
  title: string;
  content: string;
  source: string | null;
  created_at: string;
  updated_at: string;
  has_embedding: boolean;
}

export interface KnowledgeChunkList {
  items: KnowledgeChunk[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

/**
 * Zadaj pytanie systemowi RAG
 */
export async function askQuestion(data: RAGQueryRequest): Promise<RAGResponse> {
  const response = await fetch(`${API_URL}/rag/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Błąd podczas zadawania pytania');
  }

  return response.json();
}

/**
 * Wyszukaj wiedzę semantycznie
 */
export async function searchKnowledge(
  query: string,
  k: number = 10,
  category?: string
): Promise<{
  results: {
    id: string;
    title: string;
    category: string;
    content: string;
    similarity: number;
    source: string | null;
  }[];
  total: number;
  query: string;
}> {
  const response = await fetch(`${API_URL}/rag/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, k, category }),
  });

  if (!response.ok) {
    throw new Error('Błąd podczas wyszukiwania');
  }

  return response.json();
}

/**
 * Pobierz listę chunków wiedzy (admin)
 */
export async function getKnowledgeChunks(
  token: string,
  page: number = 1,
  pageSize: number = 20,
  category?: string,
  search?: string
): Promise<KnowledgeChunkList> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (category) params.append('category', category);
  if (search) params.append('search', search);

  const response = await fetch(`${API_URL}/admin/knowledge?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Błąd podczas pobierania chunków');
  }

  return response.json();
}

/**
 * Pobierz szczegóły chunka (admin)
 */
export async function getKnowledgeChunk(
  token: string,
  id: string
): Promise<KnowledgeChunk> {
  const response = await fetch(`${API_URL}/admin/knowledge/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Błąd podczas pobierania chunka');
  }

  return response.json();
}

/**
 * Utwórz nowy chunk (admin)
 */
export async function createKnowledgeChunk(
  token: string,
  data: {
    category: string;
    title: string;
    content: string;
    source?: string;
  }
): Promise<KnowledgeChunk> {
  const response = await fetch(`${API_URL}/admin/knowledge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Błąd podczas tworzenia chunka');
  }

  return response.json();
}

/**
 * Zaktualizuj chunk (admin)
 */
export async function updateKnowledgeChunk(
  token: string,
  id: string,
  data: {
    category?: string;
    title?: string;
    content?: string;
    source?: string;
  },
  regenerateEmbedding: boolean = false
): Promise<KnowledgeChunk> {
  const response = await fetch(
    `${API_URL}/admin/knowledge/${id}?regenerate_embedding=${regenerateEmbedding}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error('Błąd podczas aktualizacji chunka');
  }

  return response.json();
}

/**
 * Usuń chunk (admin)
 */
export async function deleteKnowledgeChunk(
  token: string,
  id: string
): Promise<void> {
  const response = await fetch(`${API_URL}/admin/knowledge/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Błąd podczas usuwania chunka');
  }
}

/**
 * Regeneruj embedding dla chunka (admin)
 */
export async function regenerateEmbedding(
  token: string,
  id: string
): Promise<KnowledgeChunk> {
  const response = await fetch(
    `${API_URL}/admin/knowledge/${id}/regenerate-embedding`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error('Błąd podczas regenerowania embeddingu');
  }

  return response.json();
}

/**
 * Pobierz listę kategorii (admin)
 */
export async function getCategories(token: string): Promise<{
  categories: string[];
}> {
  const response = await fetch(`${API_URL}/admin/knowledge/categories/list`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Błąd podczas pobierania kategorii');
  }

  return response.json();
}

/**
 * Pobierz status synchronizacji (admin)
 */
export async function getSyncStatus(token: string): Promise<{
  last_sync: string | null;
  pending_changes: number;
  total_chunks: number;
  is_syncing: boolean;
}> {
  const response = await fetch(`${API_URL}/admin/knowledge/sync/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Błąd podczas pobierania statusu synchronizacji');
  }

  return response.json();
}

/**
 * Przebuduj bazę wiedzy (admin)
 */
export async function rebuildKnowledgeBase(token: string): Promise<{
  success: boolean;
  chunks_processed: number;
  message: string;
}> {
  const response = await fetch(`${API_URL}/admin/knowledge/rebuild`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ confirm: true }),
  });

  if (!response.ok) {
    throw new Error('Błąd podczas przebudowywania bazy wiedzy');
  }

  return response.json();
}

/**
 * Sprawdź status RAG
 */
export async function getRAGHealth(): Promise<{
  status: string;
  total_chunks: number;
  chunks_with_embeddings: number;
  categories: string[];
  openai_api_configured: boolean;
}> {
  const response = await fetch(`${API_URL}/rag/health`);

  if (!response.ok) {
    throw new Error('Błąd podczas sprawdzania statusu RAG');
  }

  return response.json();
}
