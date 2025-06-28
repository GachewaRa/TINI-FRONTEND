// src/lib/api/notes.ts
import type { Note, Comment, Tag, Project } from '$lib/types';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export class NotesAPI {
  // Get all notes
  static async getNotes(page: number = 1, limit: number = 20, sortBy: string = 'newest'): Promise<{
    notes: Note[];
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const skip = (page - 1) * limit;
    const response = await fetch(`${API_BASE}/notes/?skip=${skip}&limit=${limit}&sort_by=${sortBy}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.statusText}`);
    }
    
    const notes = await response.json();
    
    
    // Get total count from headers or make a separate request
    const totalHeader = response.headers.get('X-Total-Count');
    
    // Fallback: if no header, assume more pages if we got a full page
    const total = totalHeader ? parseInt(totalHeader) : (notes.length === limit ? notes.length * 2 : notes.length);
    
    const totalPages = Math.ceil(total / limit);
    
    
    return {
      notes,
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }

  // Get single note with comments, tags, and matters
  static async getNote(noteId: string): Promise<Note> {
    const response = await fetch(`${API_BASE}/notes/${noteId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch note: ${response.statusText}`);
    }
    return response.json();
  }

  // Create new note
  static async createNote(noteData: {
    title: string;
    content: string;
    source: string;
    tag_ids?: string[];
  }): Promise<Note> {
    const response = await fetch(`${API_BASE}/notes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create note: ${response.statusText}`);
    }
    return response.json();
  }

  // Update note
  static async updateNote(noteId: string, noteData: {
    title?: string;
    content?: string;
    source?: string;
    tag_ids?: string[];
  }): Promise<Note> {
    const response = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(noteData),
    });
    if (!response.ok) {
      throw new Error(`Failed to update note: ${response.statusText}`);
    }
    return response.json();
  }

  // Delete note
  static async deleteNote(noteId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete note: ${response.statusText}`);
    }
  }

  // Add comment to note
  static async addComment(noteId: string, content: string): Promise<Comment> {
    const response = await fetch(`${API_BASE}/notes/${noteId}/comments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      throw new Error(`Failed to add comment: ${response.statusText}`);
    }
    return response.json();
  }

  // Add note to project
  static async addNoteToProject(projectId: string, noteId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ note_id: noteId }),
    });
    if (!response.ok) {
      throw new Error(`Failed to add note to project: ${response.statusText}`);
    }
  }

  // Add note to matter
  static async addNoteToMatter(matterId: string, noteId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/matters/${matterId}/notes/${noteId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to add note to matter: ${response.statusText}`);
    }
  }
}