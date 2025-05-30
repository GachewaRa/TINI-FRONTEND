// src/lib/api/highlights.ts
import type { Highlight } from '$lib/types';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export interface CreateHighlightRequest {
  book_title: string;
  author?: string;
  content: string;
}

export interface ApiError {
  message: string;
  status: number;
}

class HighlightsApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HighlightsApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.detail || 'An error occurred';
    } catch {
      errorMessage = errorText || `HTTP ${response.status}`;
    }
    
    throw new HighlightsApiError(response.status, errorMessage);
  }
  
  return response.json();
}

export async function fetchHighlights(): Promise<Highlight[]> {
  try {
    const response = await fetch(`${API_BASE}/highlights/`);
    const data = await handleResponse<Highlight[]>(response);
    
    // Transform dates from strings to Date objects
    return data.map(highlight => ({
      ...highlight,
      created_at: new Date(highlight.created_at),
      updated_at: new Date(highlight.updated_at)
    }));
  } catch (error) {
    if (error instanceof HighlightsApiError) {
      throw error;
    }
    throw new HighlightsApiError(0, 'Failed to fetch highlights');
  }
}

export async function fetchHighlight(id: string): Promise<Highlight> {
  try {
    const response = await fetch(`${API_BASE}/highlights/${id}`);
    const data = await handleResponse<Highlight>(response);
    
    // Transform dates from strings to Date objects
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  } catch (error) {
    if (error instanceof HighlightsApiError) {
      throw error;
    }
    throw new HighlightsApiError(0, 'Failed to fetch highlight');
  }
}

export async function createHighlight(highlight: CreateHighlightRequest): Promise<Highlight> {
  try {
    const response = await fetch(`${API_BASE}/highlights/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(highlight),
    });
    
    const data = await handleResponse<Highlight>(response);
    
    // Transform dates from strings to Date objects
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  } catch (error) {
    if (error instanceof HighlightsApiError) {
      throw error;
    }
    throw new HighlightsApiError(0, 'Failed to create highlight');
  }
}

export async function updateHighlight(id: string, highlight: Partial<CreateHighlightRequest>): Promise<Highlight> {
  try {
    const response = await fetch(`${API_BASE}/highlights/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(highlight),
    });
    
    const data = await handleResponse<Highlight>(response);
    
    // Transform dates from strings to Date objects
    return {
      ...data,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  } catch (error) {
    if (error instanceof HighlightsApiError) {
      throw error;
    }
    throw new HighlightsApiError(0, 'Failed to update highlight');
  }
}

export async function deleteHighlight(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/highlights/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.detail || 'An error occurred';
      } catch {
        errorMessage = errorText || `HTTP ${response.status}`;
      }
      
      throw new HighlightsApiError(response.status, errorMessage);
    }
  } catch (error) {
    if (error instanceof HighlightsApiError) {
      throw error;
    }
    throw new HighlightsApiError(0, 'Failed to delete highlight');
  }
}