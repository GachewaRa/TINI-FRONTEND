// src/lib/stores.ts
import { writable } from 'svelte/store';
import type { Note, Tag, Highlight, Project, SearchFilters } from './types';

// Data stores
export const notes = writable<Note[]>([]);
export const tags = writable<Tag[]>([]);
export const highlights = writable<Highlight[]>([]);
export const projects = writable<Project[]>([]);

// UI stores
export const searchFilters = writable<SearchFilters>({
  keyword: '',
  tags: [],
  tagOperation: 'and'
});

export const selectedText = writable<string>('');
export const isCreatingNote = writable<boolean>(false);

// Mock data for development
export const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Consciousness and AI',
    content: 'The relationship between consciousness and artificial intelligence is complex...',
    source: 'Consciousness Explained',
    created_at: new Date(),
    updated_at: new Date(),
    tags: [],
    comments: []
  },
  {
    id: '2',
    title: 'Neural Networks',
    content: 'Deep learning models are inspired by biological neural networks...',
    source: 'Deep Learning Book',
    created_at: new Date(),
    updated_at: new Date(),
    tags: [],
    comments: []
  }
];

export const mockTags: Tag[] = [
  {
    id: '1',
    name: 'Consciousness',
    description: 'Topics related to consciousness and awareness',
    color: '#CC7722',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2',
    name: 'AI',
    description: 'Artificial Intelligence topics',
    color: '#1e40af',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '3',
    name: 'Neuroscience',
    description: 'Brain science and neuroscience',
    color: '#059669',
    parent_id: '1',
    created_at: new Date(),
    updated_at: new Date()
  }
];