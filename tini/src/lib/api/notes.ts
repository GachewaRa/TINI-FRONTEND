// src/lib/api/notes.ts
import type { Note, Comment, Tag, Project } from '$lib/types';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

export class NotesAPI {
  // Get all notes
  static async getNotes(): Promise<Note[]> {
    const response = await fetch(`${API_BASE}/notes/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.statusText}`);
    }
    return response.json();
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

  // Get available projects (assuming this endpoint exists)
  static async getProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE}/projects/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    return response.json();
  }

  // Get available matters (assuming this endpoint exists)
//   static async getMatters(): Promise<Matter[]> {
//     const response = await fetch(`${API_BASE}/matters/`);
//     if (!response.ok) {
//       throw new Error(`Failed to fetch matters: ${response.statusText}`);
//     }
//     return response.json();
//   }
}