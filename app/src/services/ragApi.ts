const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface RAGQueryRequest {
  query: string;
  history?: { role: string; content: string }[];
  session_id?: string;
}

export interface RAGResponse {
  answer: string;
  session_id: string;
  requires_confirmation?: boolean;
}

export interface RAGSearchRequest {
  query: string;
  k?: number;
  category?: string;
}

export interface KnowledgeFile {
  name: string;
  size: number;
  modified_at: string;
}

export interface KnowledgeFileList {
  items: KnowledgeFile[];
  total: number;
}

export interface KnowledgeFileContent {
  name: string;
  content: string;
}

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

export async function getKnowledgeFiles(): Promise<KnowledgeFileList> {
  const response = await fetch(`${API_URL}/admin/knowledge/files`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Błąd podczas pobierania plików');
  }

  return response.json();
}

export async function getKnowledgeFile(name: string): Promise<KnowledgeFileContent> {
  const response = await fetch(`${API_URL}/admin/knowledge/files/${encodeURIComponent(name)}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Błąd podczas pobierania zawartości pliku');
  }

  return response.json();
}

export async function updateKnowledgeFile(name: string, content: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/admin/knowledge/files/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Błąd podczas zapisywania pliku');
  }

  return response.json();
}

export async function deleteKnowledgeFile(name: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/admin/knowledge/files/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Błąd podczas usuwania pliku');
  }

  return response.json();
}

export async function uploadKnowledgeFile(
  file: File
): Promise<{
  success: boolean;
  filename: string;
  chunks_created: number;
  message: string;
}> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/admin/knowledge/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Błąd podczas wgrywania pliku');
  }

  return response.json();
}

export async function ingestKnowledgeFile(name: string): Promise<{
  success: boolean;
  filename: string;
  chunks_created: number;
  message: string;
}> {
  const response = await fetch(
    `${API_URL}/admin/knowledge/files/${encodeURIComponent(name)}/ingest?rebuild=true`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Błąd podczas przetwarzania pliku');
  }

  return response.json();
}

export async function syncKnowledgeFiles(): Promise<{
  success: boolean;
  files_processed: number;
  chunks_created: number;
  message: string;
}> {
  const response = await fetch(`${API_URL}/admin/knowledge/sync`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Błąd podczas synchronizacji');
  }

  return response.json();
}

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

export async function getSyncStatus(): Promise<{
  last_sync: string | null;
  pending_changes: number;
  total_chunks: number;
  is_syncing: boolean;
}> {
  const response = await fetch(`${API_URL}/admin/knowledge/sync/status`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Błąd podczas pobierania statusu synchronizacji');
  }

  return response.json();
}
