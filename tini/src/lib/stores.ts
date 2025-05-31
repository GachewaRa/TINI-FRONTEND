// src/lib/stores.ts
import { writable } from 'svelte/store';
import type { Note, Tag, Highlight, Project, ProjectFolder, SearchFilters } from './types';

// Data stores
export const notes = writable<Note[]>([]);
export const tags = writable<Tag[]>([]);
export const highlights = writable<Highlight[]>([]);
export const projects = writable<Project[]>([]);
export const projectFolders = writable<ProjectFolder[]>([]);

// UI stores
export const searchFilters = writable<SearchFilters>({
  keyword: '',
  tags: [],
  tagOperation: 'and'
});

export const selectedText = writable<string>('');
export const isCreatingNote = writable<boolean>(false);

