// src/lib/api/documents.ts
import type { 
  Document, 
  DocumentHighlight, 
  CreateDocumentHighlightRequest,
  DocumentUploadRequest,
  TextSelection 
} from '$lib/types/document';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

// Documents API
export async function fetchDocuments(): Promise<Document[]> {
  const response = await fetch(`${API_BASE}/documents/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.statusText}`);
  }
  const data = await response.json();
  return data.map((doc: any) => ({
    ...doc,
    upload_date: new Date(doc.upload_date)
  }));
}

export async function fetchDocument(id: string): Promise<Document> {
  const response = await fetch(`${API_BASE}/documents/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch document: ${response.statusText}`);
  }
  const data = await response.json();
  return {
    ...data,
    upload_date: new Date(data.upload_date)
  };
}

export async function fetchDocumentContent(id: string): Promise<string> {
  const response = await fetch(`${API_BASE}/documents/${id}/content`);
  if (!response.ok) {
    throw new Error(`Failed to fetch document content: ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const data = await response.json();
    return data.content || data.html_content || '';
  }
  
  return await response.text();
}

export async function fetchDocumentStatus(id: string): Promise<{ status: string; message?: string }> {
  const response = await fetch(`${API_BASE}/documents/${id}/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch document status: ${response.statusText}`);
  }
  return await response.json();
}

export async function uploadDocument(request: DocumentUploadRequest): Promise<Document> {
  const formData = new FormData();
  formData.append('file', request.file);
  formData.append('title', request.title);

  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to upload document');
  }

  const data = await response.json();
  return {
    ...data,
    upload_date: new Date(data.upload_date)
  };
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`Failed to delete document: ${response.statusText}`);
  }
}

// Document Highlights API
export async function fetchDocumentHighlights(documentId: string, pageNumber?: number, color?: string): Promise<DocumentHighlight[]> {
  const params = new URLSearchParams();
  if (pageNumber) params.append('page_number', pageNumber.toString());
  if (color) params.append('color', color);
  
  const response = await fetch(`${API_BASE}/documents/${documentId}/highlights${params.toString() ? '?' + params.toString() : ''}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch highlights: ${response.statusText}`);
  }
  const data = await response.json();
  return data.map((highlight: any) => ({
    ...highlight,
    highlight_date: new Date(highlight.highlight_date),
    created_at: new Date(highlight.created_at),
    updated_at: new Date(highlight.updated_at)
  }));
}

export async function createHighlightFromSelection(
  documentId: string,
  selection: TextSelection,
  color: string = '#ffff00',
  userNote?: string
): Promise<DocumentHighlight> {
  const response = await fetch(`${API_BASE}/documents/${documentId}/highlights/from-selection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...selection,
      color,
      user_note: userNote
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to create highlight');
  }

  const data = await response.json();
  return {
    ...data,
    highlight_date: new Date(data.highlight_date),
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at)
  };
}

export async function createDocumentHighlight(
  documentId: string,
  request: CreateDocumentHighlightRequest
): Promise<DocumentHighlight> {
  const response = await fetch(`${API_BASE}/documents/${documentId}/highlights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to create highlight');
  }

  const data = await response.json();
  return {
    ...data,
    highlight_date: new Date(data.highlight_date),
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at)
  };
}

export async function updateDocumentHighlight(
  id: string,
  updates: Partial<CreateDocumentHighlightRequest>
): Promise<DocumentHighlight> {
  const response = await fetch(`${API_BASE}/documents/highlights/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Failed to update highlight');
  }

  const data = await response.json();
  return {
    ...data,
    highlight_date: new Date(data.highlight_date),
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at)
  };
}

export async function deleteDocumentHighlight(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/highlights/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`Failed to delete highlight: ${response.statusText}`);
  }
}

export async function searchDocumentHighlights(query: string): Promise<DocumentHighlight[]> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`${API_BASE}/documents/highlights/search?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to search highlights: ${response.statusText}`);
  }
  const data = await response.json();
  return data.map((highlight: any) => ({
    ...highlight,
    highlight_date: new Date(highlight.highlight_date),
    created_at: new Date(highlight.created_at),
    updated_at: new Date(highlight.updated_at)
  }));
}